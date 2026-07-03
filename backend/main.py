import os
import json
import random
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import secrets

from database import engine, Base, get_db
import models, schemas, pdf_parser, ai_engine

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Customer Insight & Survey Intelligence Platform API")

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# Surveys Endpoints
# ==========================================

@app.get("/api/surveys", response_model=List[schemas.SurveyOut])
def list_surveys(db: Session = Depends(get_db)):
    return db.query(models.Survey).order_by(models.Survey.id.desc()).all()

@app.post("/api/surveys", response_model=schemas.SurveyOut, status_code=status.HTTP_201_CREATED)
def create_survey(survey: schemas.SurveyCreate, db: Session = Depends(get_db)):
    db_survey = models.Survey(title=survey.title, description=survey.description)
    db.add(db_survey)
    db.commit()
    db.refresh(db_survey)

    for index, q in enumerate(survey.questions):
        db_question = models.Question(
            survey_id=db_survey.id,
            type=q.type,
            question_text=q.question_text,
            options=q.options,
            category=q.category,
            order=index
        )
        db.add(db_question)
    
    db.commit()
    db.refresh(db_survey)
    return db_survey

@app.get("/api/surveys/{survey_id}", response_model=schemas.SurveyOut)
def get_survey(survey_id: int, db: Session = Depends(get_db)):
    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    return survey

@app.delete("/api/surveys/{survey_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_survey(survey_id: int, db: Session = Depends(get_db)):
    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    db.delete(survey)
    db.commit()
    return None

@app.post("/api/surveys/{survey_id}/publish")
def publish_survey(survey_id: int, request: Request, db: Session = Depends(get_db)):
    """Publish a survey, generate a unique share token and URL.
    If already published, ensure token uniqueness.
    """
    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    # Ensure a unique share token
    if not survey.share_token:
        token = secrets.token_urlsafe(8)
        while db.query(models.Survey).filter(models.Survey.share_token == token).first():
            token = secrets.token_urlsafe(8)
        survey.share_token = token
    survey.is_published = True
    db.commit()
    db.refresh(survey)
    # Build absolute share URL using request base URL
    base = str(request.base_url).rstrip('/')
    share_url = f"{base}/s/{survey.share_token}"
    return {
        "survey_id": survey.id,
        "share_token": survey.share_token,
        "share_url": share_url,
    }

@app.get("/api/public/survey/{token}")
def get_public_survey(token: str, db: Session = Depends(get_db)):
    # Retrieve the survey by share token ensuring it's published
    survey = db.query(models.Survey).filter(
        models.Survey.share_token == token,
        models.Survey.is_published == True
    ).first()

    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    # Build response matching SurveyOut schema
    survey_data = {
        "id": survey.id,
        "title": survey.title,
        "description": survey.description,
        "created_at": survey.created_at,
        "share_token": survey.share_token,
        "is_published": survey.is_published,
        "questions": [
            {
                "id": q.id,
                "survey_id": survey.id,
                "type": q.type,
                "question_text": q.question_text,
                "options": q.options,
                "category": q.category,
                "order": q.order,
            }
            for q in survey.questions
        ],
    }
    return survey_data
# ==========================================
# Responses Submission
# ==========================================

@app.post("/api/surveys/{survey_id}/responses", response_model=schemas.ResponseOut, status_code=status.HTTP_201_CREATED)
def submit_response(survey_id: int, response_data: schemas.ResponseCreate, db: Session = Depends(get_db)):
    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    db_response = models.Response(survey_id=survey_id)
    db.add(db_response)
    db.commit()
    db.refresh(db_response)

    for ans in response_data.answers:
        db_answer = models.Answer(
            response_id=db_response.id,
            question_id=ans.question_id,
            answer_text=ans.answer_text
        )
        db.add(db_answer)
    
    db.commit()
    db.refresh(db_response)
    return db_response

    
@app.post("/api/public/survey/{token}/response")
def submit_public_response(
    token: str,
    response_data: schemas.ResponseCreate,
    db: Session = Depends(get_db)
):

    survey = db.query(models.Survey).filter(
        models.Survey.share_token == token,
        models.Survey.is_published == True
    ).first()

    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    db_response = models.Response(
        survey_id=survey.id
    )

    db.add(db_response)
    db.commit()
    db.refresh(db_response)

    for ans in response_data.answers:

        db_answer = models.Answer(
            response_id=db_response.id,
            question_id=ans.question_id,
            answer_text=ans.answer_text
        )

        db.add(db_answer)

    db.commit()

    return {
        "message": "Response submitted successfully"
    }
# ==========================================
# Module 1: AI Survey Generator Router
# ==========================================

@app.post("/api/generate-survey", response_model=schemas.SurveyGenerateResponse)
async def generate_survey_endpoint(
    product_name: str = Form(...),
    product_description: str = Form(...),
    specifications: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    extracted_text = ""
    if file and file.filename.endswith('.pdf'):
        pdf_bytes = await file.read()
        extracted_text = pdf_parser.extract_text_from_pdf(pdf_bytes)
        # Append extracted PDF text to specifications or description
        if extracted_text.startswith("Error"):
            raise HTTPException(status_code=400, detail=extracted_text)
    
    full_specs = (specifications or "") + "\n" + extracted_text
    
    try:
        generated_data = ai_engine.generate_survey_questions(
            product_name=product_name,
            product_description=product_description,
            specifications=full_specs
        )
        return generated_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

# ==========================================
# Module 3: Response Analytics
# ==========================================

@app.get("/api/surveys/{survey_id}/analytics", response_model=schemas.SurveyAnalytics)
def get_survey_analytics(survey_id: int, db: Session = Depends(get_db)):
    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
        
    responses = db.query(models.Response).filter(models.Response.survey_id == survey_id).all()
    total_responses = len(responses)
    
    questions_analytics = []
    total_rating_value = 0.0
    total_rating_count = 0

    for q in survey.questions:
        q_answers = db.query(models.Answer).filter(models.Answer.question_id == q.id).all()
        q_total_answers = len(q_answers)
        
        avg_score = None
        nps_score = None
        mcq_distribution = []
        rating_distribution = []
        text_responses = []

        if q.type == "MCQ" and q.options:
            try:
                options_list = json.loads(q.options)
            except Exception:
                options_list = []
            
            counts = {opt: 0 for opt in options_list}
            for ans in q_answers:
                if ans.answer_text in counts:
                    counts[ans.answer_text] += 1
                else:
                    # Graceful fallback for slight matching variations
                    for opt in options_list:
                        if opt.lower() == ans.answer_text.lower():
                            counts[opt] += 1
                            break
            
            mcq_distribution = [schemas.MCQOptionCount(option=opt, count=cnt) for opt, cnt in counts.items()]
            
        elif q.type in ["Rating", "NPS"]:
            scores = []
            rating_counts = {i: 0 for i in range(1, 6)} if q.type == "Rating" else {i: 0 for i in range(11)}
            
            for ans in q_answers:
                try:
                    val = int(float(ans.answer_text))
                    if val in rating_counts:
                        rating_counts[val] += 1
                        scores.append(val)
                except ValueError:
                    pass
            
            if scores:
                avg_score = sum(scores) / len(scores)
                # Only Rating questions (1-5 scale) contribute to overall satisfaction score.
                # NPS is a loyalty metric, not a satisfaction score, so it is excluded here.
                if q.type == "Rating":
                    # Convert 1-5 scale to percentage (e.g. 5=100%, 4=80%, etc.)
                    total_rating_value += sum([(s - 1) / 4.0 * 100 for s in scores])
                    total_rating_count += len(scores)

            if q.type == "Rating":
                rating_distribution = [schemas.RatingDistribution(value=v, count=c) for v, c in rating_counts.items()]
            else: # NPS Calculation
                rating_distribution = [schemas.RatingDistribution(value=v, count=c) for v, c in rating_counts.items()]
                if scores:
                    promoters = sum(1 for s in scores if s >= 9)
                    detractors = sum(1 for s in scores if s <= 6)
                    nps_score = ((promoters - detractors) / len(scores)) * 100

        elif q.type == "Text":
            text_responses = [ans.answer_text for ans in q_answers if ans.answer_text.strip()]

        questions_analytics.append(schemas.QuestionAnalytics(
            question_id=q.id,
            question_text=q.question_text,
            type=q.type,
            category=q.category,
            total_answers=q_total_answers,
            average_score=avg_score,
            nps_score=nps_score,
            mcq_distribution=mcq_distribution,
            rating_distribution=rating_distribution,
            text_responses=text_responses
        ))

    # Calculate overall satisfaction score
    sat_score = (total_rating_value / total_rating_count) if total_rating_count > 0 else 0.0
    
    # Calculate overall NPS if any NPS questions exist
    nps_questions = [qa for qa in questions_analytics if qa.type == "NPS"]
    nps_overall = nps_questions[0].nps_score if nps_questions and nps_questions[0].nps_score is not None else None

    return schemas.SurveyAnalytics(
        survey_id=survey.id,
        title=survey.title,
        total_responses=total_responses,
        satisfaction_score=round(sat_score, 1),
        nps_overall=round(nps_overall, 1) if nps_overall is not None else None,
        questions_analytics=questions_analytics
    )

# ==========================================
# Module 4: AI Insight Engine Router
# ==========================================

@app.get("/api/surveys/{survey_id}/insights", response_model=schemas.AIInsights)
def get_survey_insights_endpoint(survey_id: int, db: Session = Depends(get_db)):
    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    # Extract text answers (usually pain points/text comments)
    text_answers = []
    text_questions = db.query(models.Question).filter(models.Question.survey_id == survey_id, models.Question.type == "Text").all()
    
    for q in text_questions:
        q_answers = db.query(models.Answer).filter(models.Answer.question_id == q.id).all()
        text_answers.extend([ans.answer_text for ans in q_answers if ans.answer_text.strip()])

    return ai_engine.analyze_survey_insights(survey_id, text_answers)

# ==========================================
# Module 5: SEO Recommendation Engine Router
# ==========================================

@app.get("/api/surveys/{survey_id}/seo-recommendations", response_model=schemas.SEOEngineOutput)
def get_survey_seo_recommendations_endpoint(survey_id: int, db: Session = Depends(get_db)):
    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    text_answers = []
    text_questions = db.query(models.Question).filter(models.Question.survey_id == survey_id, models.Question.type == "Text").all()
    for q in text_questions:
        q_answers = db.query(models.Answer).filter(models.Answer.question_id == q.id).all()
        text_answers.extend([ans.answer_text for ans in q_answers if ans.answer_text.strip()])

    return ai_engine.generate_seo_recommendations(survey_id, text_answers)

# ==========================================
# Helper: Mock Responses Hydration Generator
# ==========================================

@app.post("/api/surveys/{survey_id}/generate-mock-responses", status_code=status.HTTP_201_CREATED)
def generate_mock_responses(survey_id: int, db: Session = Depends(get_db)):
    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    is_flow = "flow" in survey.title.lower() or "vortex" in survey.title.lower() or "fluerexa" in survey.title.lower()
    is_gas = "gas" in survey.title.lower() or "controller" in survey.title.lower() or "mass" in survey.title.lower()

    # Flow sensor qualitative comments
    flow_feedback = [
        "Vortex units are accurate, but unit cost is too high for scaling in cooling lines.",
        "We desperately need EtherCAT interface. Modbus is too slow for real-time control loops.",
        "Physical mounting was extremely tight. Had to modify our bypass piping manifolds.",
        "How do I choose a vortex flow sensor for high-temperature steam lines? The guide is unclear.",
        "Can this sensor handle slight slurry? Looking for vortex flow sensor selection advice.",
        "Is there a comparison guide of vortex flow sensor selection for steam vs gas?",
        "Awesome accuracy but too expensive for standard water piping.",
        "Wiring manual does not explain RS485 termination resistor settings properly.",
        "Integrating into our automated PLC took 3 days instead of 3 hours. Better setup documentation needed.",
        "We switched from differential pressure orifice plates and are happy with pressure drops, but price is high.",
        "Does the FLUEREXA flow meter have an explosion proof rating for chemical integration?",
        "Modbus register address documentation is confusing, we wasted two days debugging floating point formats.",
        "pricing is too high compared to basic turbine flow meters.",
        "Excellent repeatibility. But please release an EtherCAT version soon.",
        "How do I choose a vortex flow sensor for low-flow chemical dosing? Is it stable?",
        "Need clean straight-run requirements documented better in the datasheet.",
        "Solid state design is awesome. No turbine blades to clean anymore.",
        "Why aren't there more articles on vortex flow sensor selection rules of thumb?",
        "The software utility for sensor setup is Windows-only, we need a Linux tool.",
        "Accuracy is exactly as advertised (±1%), but the lead time was 8 weeks."
    ]

    # Gas controller comments
    gas_feedback = [
        "Unit price is steep for high-channel gas mixing chambers.",
        "Need Profinet protocol. Ethernet/IP setup took too long.",
        "Response time is amazing (<50ms), but grounding is sensitive to electrical noise.",
        "The calibration tool is expensive to purchase separately.",
        "How to select a mass flow controller for corrosive gas channels?",
        "Fittings leak if not torqued precisely. Suggest clarifying mechanical drawings.",
        "DeviceNet is outdated, we need EtherCAT support.",
        "What are the sizing rules of thumb for MFC bypass valves?",
        "Outstanding resolution but pricing needs to come down for mass orders.",
        "Software calibration utility crashes on Windows 11.",
        "Wiring schematics are tiny and hard to read.",
        "How to calibrate mass flow controllers in-situ without taking them out of the cleanroom?"
    ]

    # General feedback
    generic_feedback = [
        "Great quality but pricing is way higher than standard vendors.",
        "Integration instructions are very light, needs a proper system configuration guide.",
        "Protocol support is limited, we need CANopen or EtherCAT.",
        "Physical housing is too bulky for our compact enclosure.",
        "Why is there no troubleshooting guide for setup errors?",
        "How to integrate this hardware into a standard PLC cabinet?",
        "Customer support took 48 hours to reply about register mappings.",
        "Excellent rugged casing. But pricing is a friction point.",
        "Integration software is hard to install.",
        "Is there an online sizing calculator?"
    ]

    comments_pool = flow_feedback if is_flow else (gas_feedback if is_gas else generic_feedback)
    
    # Create 35 responses
    num_responses = 35
    for _ in range(num_responses):
        db_response = models.Response(survey_id=survey_id)
        db.add(db_response)
        db.commit()
        db.refresh(db_response)

        # Reset available_comments each response so the pool is never permanently depleted
        available_comments = list(comments_pool)

        for q in survey.questions:
            ans_text = ""
            if q.type == "MCQ" and q.options:
                try:
                    options_list = json.loads(q.options)
                    # We will weigh first options higher to make answers look realistic
                    weights = [0.5, 0.3, 0.15, 0.05][:len(options_list)]
                    # Normalize weights
                    w_sum = sum(weights)
                    weights = [w/w_sum for w in weights]
                    ans_text = random.choices(options_list, weights=weights)[0]
                except Exception:
                    ans_text = "N/A"
            elif q.type == "NPS":
                # Realistic NPS distribution: mostly Promoters (9-10) and Passives (7-8), some Detractors (0-6)
                ans_text = str(random.choices([10, 9, 8, 7, 6, 5, 4, 3], weights=[0.4, 0.3, 0.15, 0.08, 0.03, 0.02, 0.01, 0.01])[0])
            elif q.type == "Rating":
                # Mostly 4 and 5 stars
                ans_text = str(random.choices([5, 4, 3, 2, 1], weights=[0.5, 0.35, 0.1, 0.03, 0.02])[0])
            elif q.type == "Text":
                if not available_comments:
                    available_comments = list(comments_pool)
                ans_text = random.choice(available_comments)
                available_comments.remove(ans_text)
            
            db_answer = models.Answer(
                response_id=db_response.id,
                question_id=q.id,
                answer_text=ans_text
            )
            db.add(db_answer)
        
    db.commit()
    return {"message": f"Successfully generated {num_responses} mock responses."}

# ==========================================
# Static Files serving for React Build
# ==========================================

frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")

if os.path.exists(frontend_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dir, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Prevent masking actual api routes
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="Not found")
        index_file = os.path.join(frontend_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
else:
    @app.get("/")
    def read_root():
        return {
            "status": "Running",
            "message": "FastAPI is running successfully. Frontend is not compiled yet. Please run React build inside frontend/ or use development server."
        }
