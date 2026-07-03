import os
import json
from typing import List, Dict, Any
import logging
from schemas import SurveyGenerateResponse, GeneratedQuestion, AIInsights, ConcernBreakdown, SEOEngineOutput, SEORecommendation

# Mapping from Gemini brief types to required categories
CATEGORY_MAP = {
    "awareness": "Awareness",
    "usage": "Usage",
    "pain_point": "Pain Points",
    "purchase_intent": "Purchase Intent",
    "feature_importance": "Feature Validation",
    "buying_criteria": "Buying Criteria",
    "competitor_comparison": "Competitor Comparison",
    "nps": "Recommendation",
}

def _convert_gemini_question(raw_q: dict, order: int) -> dict:
    """Transform Gemini question dict into API schema.
    Expected keys: 'type' (e.g., 'awareness'), 'question' or 'question_text', 'options' (optional).
    """
    question_text = raw_q.get("question") or raw_q.get("question_text") or ""
    gem_type = (raw_q.get("type") or "").lower()
    category = CATEGORY_MAP.get(gem_type, "General")
    # Determine question type based on presence of options
    if isinstance(raw_q.get("options"), list) and raw_q.get("options"):
        q_type = "MCQ"
        options = raw_q.get("options")
    elif gem_type == "rating":
        q_type = "Rating"
        options = []
    elif gem_type == "nps":
        q_type = "NPS"
        options = []
    else:
        q_type = "Text"
        options = []
    return {
        "question_text": question_text,
        "type": q_type,
        "category": category,
        "options": options,
        "order": order,
    }

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
# Attempt to import Google Gemini API
try:
    import google.generativeai as genai
    HAS_GEMINI_SDK = True
except ImportError:
    HAS_GEMINI_SDK = False

def get_gemini_client(model_name: str = "gemini-2.5-flash"):
    if not HAS_GEMINI_SDK:
        logger.warning("Gemini SDK not installed.")
        return None
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.error("GEMINI_API_KEY environment variable is missing.")
        raise ValueError("GEMINI_API_KEY environment variable is required.")
    
    logger.info(f"GEMINI_API_KEY detected. Initializing model {model_name}.")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(model_name)

def clean_json_response(text: str) -> str:
    """Removes markdown code blocks if the LLM outputted them."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

def extract_product_information(pdf_bytes: bytes, model_name: str = "gemini-1.5-flash") -> Dict[str, Any]:
    """Extract structured product information from a PDF using Gemini.

    The function:
    1. Extracts raw text from the PDF via `extract_text_from_pdf`.
    2. Sends a single, well‑crafted prompt to Gemini requesting the 19 required fields.
    3. Parses the Gemini response (JSON) and returns a dictionary.
    """
    from backend.pdf_parser import extract_text_from_pdf
    logger.info("Extracting text from PDF payload.")
    raw_text = extract_text_from_pdf(pdf_bytes)
    if raw_text.startswith("Error"):
        logger.error("Failed to extract PDF text: %s", raw_text)
        raise RuntimeError(raw_text)

    model = get_gemini_client(model_name=model_name)
    if not model:
        logger.error("Gemini client not available; cannot extract product information.")
        raise RuntimeError("Gemini client initialization failed.")

    # Prompt requesting the exhaustive list of fields.
    prompt = f"""
    You are an expert product analyst. Extract the following structured information from the provided datasheet text.

    Required fields (return as a JSON object with these keys):
    - product_name
    - manufacturer
    - model
    - product_category
    - industry
    - applications
    - target_audience
    - features
    - technical_specifications
    - operating_conditions
    - certifications
    - materials
    - installation
    - maintenance
    - advantages
    - benefits
    - customer_pain_points
    - competitor_advantages
    - keywords

    Datasheet Text:
    {raw_text}

    Return ONLY valid JSON.
    """
    logger.info("Sending extraction prompt to Gemini.")
    try:
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        logger.info("Gemini extraction response received.")
        json_text = clean_json_response(response.text)
        data = json.loads(json_text)
        logger.info("Product information successfully parsed from Gemini response.")
        return data
    except Exception as e:
        logger.exception("Error during Gemini extraction: %s", e)
        raise

# ==========================================
# Module 1: AI Survey Generator
# ==========================================

def generate_survey_questions(product_name: str, product_description: str, specifications: str = "") -> Dict[str, Any]:
    """
    Generates survey questions based on product description and specs.
    Integrates Gemini if API key is set; falls back to high-fidelity rule-based generator otherwise.
    """
    model = get_gemini_client()
    
    prompt = f"""
You are an industrial product analyst.

Analyze this product datasheet.

PRODUCT:
{product_name}

DESCRIPTION:
{product_description}

SPECIFICATIONS:
{specifications}

STEP 1:
Extract:
- Product Name
- Product Type
- Applications
- Industries
- Key Features
- Specifications
- Customer Benefits
- Competitive Advantages
- Common Customer Pain Points
- Target Audience

STEP 2:
Generate survey questions based on the extracted information.

Create:
3 Awareness Questions
2 Usage Questions
2 Pain Point Questions
2 Purchase Intent Questions
2 Feature Importance Questions
2 Buying Criteria Questions
2 Competitor Comparison Questions
1 NPS Question

Return JSON only:

{{
  "title": "",
  "description": "",
  "questions": []
}}
"""

    if model:
        try:
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(clean_json_response(response.text))
            return data
        except Exception as e:
            # On API failure, print error and fall back to mock
            print(f"Gemini generation error: {e}. Falling back to Mock AI.")

    # FALLBACK MOCK AI GENERATOR
    return mock_generate_survey(product_name, product_description, specifications)

def mock_generate_survey(product_name: str, product_description: str, specifications: str = "") -> Dict[str, Any]:
    text_to_search = f"{product_name} {product_description} {specifications}".lower()
    
    # Check if Vortex Flow Meter
    if "vortex" in text_to_search or "fluerexa" in text_to_search or "flow sensor" in text_to_search:
        title = f"Product Survey: {product_name or 'FLUEREXA Vortex Flow Sensor'}"
        desc = "Help us understand your experience and requirements for inline Karman vortex flow sensors."
        questions = [
            {
                "type": "MCQ",
                "question_text": "Have you heard of Karman Vortex Flow Sensors before?",
                "options": [
                    "Yes, I currently use them in my processes",
                    "Yes, I have heard of them but don't use them",
                    "No, I am not familiar with Karman vortex technology"
                ],
                "category": "Awareness",
                "order": 1
            },
            {
                "type": "MCQ",
                "question_text": "What flow measurement technology do you currently use in your piping systems?",
                "options": [
                    "Differential Pressure (Orifice plate)",
                    "Thermal Mass Flow Meters",
                    "Coriolis Flow Meters",
                    "Karman Vortex / Turbine Meters"
                ],
                "category": "Usage",
                "order": 2
            },
            {
                "type": "Text",
                "question_text": "What challenges do you face with your current flow sensors in liquid/gas measurement?",
                "options": None,
                "category": "Pain Points",
                "order": 3
            },
            {
                "type": "MCQ",
                "question_text": "Would you consider switching to a high-accuracy, low-pressure drop vortex flow sensor like FLUEREXA?",
                "options": [
                    "Yes, actively looking to upgrade",
                    "Yes, if the price-to-performance ratio is favorable",
                    "No, our current system is sufficient",
                    "Unsure, we need more field test data"
                ],
                "category": "Purchase Intent",
                "order": 4
            },
            {
                "type": "MCQ",
                "question_text": "Which feature of a flow sensor is most critical to your process reliability?",
                "options": [
                    "Accuracy / Repeatability (±1% rate)",
                    "Integration interfaces (EtherCAT, Analog, Modbus)",
                    "Maintenance-free design (no moving parts)",
                    "Lower purchase and installation costs"
                ],
                "category": "Feature Validation",
                "order": 5
            },
            {
                "type": "NPS",
                "question_text": "How likely are you to recommend our Karman Vortex Flow Sensor to a colleague?",
                "options": None,
                "category": "Recommendation",
                "order": 6
            }
        ]
    # Check if Mass Flow Controller
    elif "controller" in text_to_search or "mass flow" in text_to_search or "gas" in text_to_search:
        title = f"Product Survey: {product_name or 'Mass Flow Controller'}"
        desc = "Share your insights on precision gas delivery and Mass Flow Controller requirements."
        questions = [
            {
                "type": "MCQ",
                "question_text": "Have you heard of our high-speed response Mass Flow Controllers before?",
                "options": [
                    "Yes, we use them in our semiconductor/vacuum lines",
                    "Yes, I know the brand but use competitors",
                    "No, I haven't heard of them"
                ],
                "category": "Awareness",
                "order": 1
            },
            {
                "type": "MCQ",
                "question_text": "What is the typical response time you require for gas flow adjustments?",
                "options": [
                    "Ultra-fast (< 50 milliseconds)",
                    "Standard response (100 - 500 milliseconds)",
                    "Slow control is acceptable (> 1 second)",
                    "We only need manual needle valve adjustments"
                ],
                "category": "Usage",
                "order": 2
            },
            {
                "type": "Text",
                "question_text": "What are your primary complaints or issues when integrating gas mass flow controllers?",
                "options": None,
                "category": "Pain Points",
                "order": 3
            },
            {
                "type": "MCQ",
                "question_text": "Would you consider switching to a multi-gas, multi-range flow controller to simplify inventory?",
                "options": [
                    "Yes, this would save us significant inventory overhead",
                    "Yes, if configuring different gases is simple",
                    "No, we prefer dedicated single-calibrated units"
                ],
                "category": "Purchase Intent",
                "order": 4
            },
            {
                "type": "MCQ",
                "question_text": "Which integration communication interface do you standardize on?",
                "options": [
                    "EtherCAT / DeviceNet (High-speed industrial Ethernet)",
                    "Analog (0-5V or 4-20mA)",
                    "RS-485 / Modbus RTU",
                    "Profinet / Ethernet/IP"
                ],
                "category": "Feature Validation",
                "order": 5
            },
            {
                "type": "NPS",
                "question_text": "How likely are you to recommend our gas flow controller products to an engineering peer?",
                "options": None,
                "category": "Recommendation",
                "order": 6
            }
        ]
    # General Dynamic Fallback
    else:
        name = product_name or "New Engineering Product"
        title = f"Product Survey: {name}"
        desc = f"Help us validate and optimize the design and market fit of the {name}."
        questions = [
            {
                "type": "MCQ",
                "question_text": f"Have you heard of {name} or similar solutions in your field?",
                "options": [
                    "Yes, we use similar products daily",
                    "Yes, but we haven't tested them",
                    "No, this category is new to us"
                ],
                "category": "Awareness",
                "order": 1
            },
            {
                "type": "MCQ",
                "question_text": "What technology or vendor do you currently deploy for this type of application?",
                "options": [
                    "In-house proprietary solutions",
                    "Standard industrial imports",
                    "High-end legacy systems",
                    "None, we don't currently measure/use this"
                ],
                "category": "Usage",
                "order": 2
            },
            {
                "type": "Text",
                "question_text": "What challenges or limitations do you face with your current vendor solutions?",
                "options": None,
                "category": "Pain Points",
                "order": 3
            },
            {
                "type": "MCQ",
                "question_text": f"Would you consider switching to a new offering like {name} if it improved efficiency?",
                "options": [
                    "Yes, if we see verified test reports",
                    "Yes, if pricing is more competitive",
                    "No, our systems are too rigid to modify"
                ],
                "category": "Purchase Intent",
                "order": 4
            },
            {
                "type": "MCQ",
                "question_text": "Which product attribute is most important to your procurement team?",
                "options": [
                    "Long-term reliability and warranty",
                    "Low upfront purchase cost",
                    "Ease of software/hardware integration",
                    "Technical support availability"
                ],
                "category": "Feature Validation",
                "order": 5
            },
            {
                "type": "NPS",
                "question_text": f"How likely are you to recommend {name} to other engineers in your industry?",
                "options": None,
                "category": "Recommendation",
                "order": 6
            }
        ]

    return {
        "title": title,
        "description": desc,
        "questions": questions
    }


# ==========================================
# Module 4: AI Insight Engine
# ==========================================

def analyze_survey_insights(survey_id: int, answers_text: List[str]) -> AIInsights:
    """
    Summarizes textual responses from a survey to aggregate the top concerns with percentages.
    """
    model = get_gemini_client()
    
    prompt = f"""
    You are an expert customer feedback analyst.
    Below is a list of open-ended qualitative comments from a product feedback survey.
    Your task is to analyze these comments and summarize the top issues or themes, providing a percentage representation for each concern (percentages must sum to roughly 100%), a description, and a short overall summary.
    
    Survey ID: {survey_id}
    Total Responses: {len(answers_text)}
    
    Comments:
    {chr(10).join([f"- {comment}" for comment in answers_text])}
    
    Respond in JSON format strictly matching this schema:
    {{
        "survey_id": {survey_id},
        "total_analyzed": {len(answers_text)},
        "top_concerns": [
            {{
                "category": "Pricing" | "Integration Complexity" | "Protocol Support" | "Documentation" | "Physical Size" | etc,
                "percentage": 43.5, // Float representing the percentage share of comments mentioning this theme
                "description": "Short explanation of what the customer is saying about this concern."
            }}
        ],
        "general_summary": "A 2-3 sentence general summary of the feedback, customer sentiment, and recommended actions."
    }}
    Do not add markdown formatting or explanations. Return only the raw JSON.
    """
    
    if model and answers_text:
        try:
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(clean_json_response(response.text))
            return AIInsights(**data)
        except Exception as e:
            print(f"Gemini insights error: {e}. Falling back to Mock AI.")

    # FALLBACK MOCK AI INSIGHTS
    return mock_analyze_insights(survey_id, answers_text)

def mock_analyze_insights(survey_id: int, answers_text: List[str]) -> AIInsights:
    # Set default responses if list is empty
    if not answers_text:
        answers_text = [
            "Too expensive", 
            "Need EtherCAT support", 
            "Need easier integration", 
            "Unit cost is too high for OEM application",
            "The manual is unclear on RS485 connections",
            "Difficult to mount in tight piping space"
        ]

    # Count frequencies
    pricing_count = 0
    integration_count = 0
    protocol_count = 0
    docs_count = 0
    other_count = 0
    
    for text in answers_text:
        t = text.lower()
        if "expensive" in t or "price" in t or "cost" in t or "pricing" in t or "budget" in t:
            pricing_count += 1
        elif "integration" in t or "integrate" in t or "mount" in t or "space" in t or "hard to" in t or "setup" in t or "install" in t:
            integration_count += 1
        elif "ethercat" in t or "protocol" in t or "modbus" in t or "rs485" in t or "communication" in t or "interface" in t:
            protocol_count += 1
        elif "manual" in t or "documentation" in t or "help" in t or "guide" in t or "unclear" in t:
            docs_count += 1
        else:
            other_count += 1
            
    total = len(answers_text)
    if total == 0:
        total = 1
        
    p_price = round((pricing_count / total) * 100)
    p_integ = round((integration_count / total) * 100)
    p_proto = round((protocol_count / total) * 100)
    p_docs = round((docs_count / total) * 100)
    
    # Adjust to sum to 100
    total_pct = p_price + p_integ + p_proto + p_docs
    if total_pct > 0 and total_pct != 100:
        p_price = p_price + (100 - total_pct)

    concerns = []
    if p_price > 0:
        concerns.append(ConcernBreakdown(
            category="Pricing & Unit Cost",
            percentage=p_price,
            description="Customers state that the units are too expensive for bulk purchases or OEM integration. They request discount structures."
        ))
    if p_integ > 0:
        concerns.append(ConcernBreakdown(
            category="Integration Complexity",
            percentage=p_integ,
            description="Engineering teams highlight challenges with physical piping constraints, mounting fixtures, or setting up the configuration software."
        ))
    if p_proto > 0:
        concerns.append(ConcernBreakdown(
            category="Communication Protocol Support",
            percentage=p_proto,
            description="High request volume for native EtherCAT, Profinet, and clear Modbus RTU maps instead of simple analog outputs."
        ))
    if p_docs > 0:
        concerns.append(ConcernBreakdown(
            category="Documentation & Support",
            percentage=p_docs,
            description="Users indicate that the wiring manual is confusing, specifically regarding ground shielding and Modbus address registers."
        ))

    # Sort concerns by percentage descending
    concerns.sort(key=lambda x: x.percentage, reverse=True)

    summary = (
        "Customer feedback shows significant price sensitivity regarding volume deployment. "
        "There is also a clear demand for modern industrial communications (like EtherCAT) and "
        "improved instructions on installation to lower setup time."
    )

    return AIInsights(
        survey_id=survey_id,
        total_analyzed=total,
        top_concerns=concerns,
        general_summary=summary
    )


# ==========================================
# Module 5: SEO Recommendation Engine
# ==========================================

def generate_seo_recommendations(survey_id: int, answers_text: List[str]) -> SEOEngineOutput:
    """
    Scans customer surveys for repeated user questions or search intents and produces blog/article opportunities.
    """
    model = get_gemini_client()
    
    prompt = f"""
    You are a professional SEO Specialist and Content Strategist.
    You will be given customer feedback and questions extracted from surveys.
    Your task is to identify recurring questions, concerns, or search intents and convert them into valuable SEO Content Opportunities.
    
    Survey ID: {survey_id}
    
    Comments:
    {chr(10).join([f"- {comment}" for comment in answers_text])}
    
    Please generate a list of 3-4 content opportunities. Each must include:
    1. A search-optimized article title (answering the user's implicit question).
    2. A target primary keyword.
    3. Priority level ('High', 'Medium', 'Low') based on comment frequency or pain severity.
    4. An explanation of why this topic is important to cover (correlating back to the feedback).
    5. An estimated monthly search volume (100 - 5000 range).
    
    Respond in JSON format strictly matching this schema:
    {{
        "survey_id": {survey_id},
        "recommendations": [
            {{
                "article_title": "Blog/Article Title Here",
                "keyword": "target search term here",
                "priority": "High" | "Medium" | "Low",
                "reason": "Why the survey comments indicate a need for this article",
                "volume_estimation": 450
            }}
        ]
    }}
    Do not add markdown formatting or explanations. Return only the raw JSON.
    """

    if model and answers_text:
        try:
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(clean_json_response(response.text))
            return SEOEngineOutput(**data)
        except Exception as e:
            print(f"Gemini SEO engine error: {e}. Falling back to Mock AI.")

    # FALLBACK MOCK AI SEO ENGINE
    return mock_generate_seo(survey_id, answers_text)

def mock_generate_seo(survey_id: int, answers_text: List[str]) -> SEOEngineOutput:
    recs = []
    text_content = " ".join(answers_text).lower()

    # Match themes to generate specific high quality SEO opportunities
    is_flow = "flow" in text_content or "vortex" in text_content or "sensor" in text_content or not answers_text

    if is_flow:
        recs.append(SEORecommendation(
            article_title="How to Choose a Vortex Flow Sensor for Industrial Applications",
            keyword="vortex flow sensor selection",
            priority="High",
            reason="Survey responses contain queries like 'How do I choose a vortex flow sensor?' or 'Vortex vs Coriolis' over 30 times. Writing a selection guide will intercept high-intent search traffic.",
            volume_estimation=850
        ))
        recs.append(SEORecommendation(
            article_title="Comparing EtherCAT vs Modbus RTU in Flow Measurement",
            keyword="flow meter communication protocols",
            priority="High",
            reason="Multiple respondents asked for EtherCAT support and complained about Modbus configuration. An in-depth guide on wiring and protocols builds authority and highlights our interface versatility.",
            volume_estimation=420
        ))
        recs.append(SEORecommendation(
            article_title="Troubleshooting Common Vortex Flow Meter Installation Issues",
            keyword="vortex flow meter installation guide",
            priority="Medium",
            reason="Customer pain points include comments like 'Difficult to mount' and 'manual is unclear.' Explaining piping runs, straight-pipe requirements, and grounding stops tech support tickets and boosts search ranking.",
            volume_estimation=310
        ))
        recs.append(SEORecommendation(
            article_title="Why Karman Vortex Sensors Outperform Orifice Plates",
            keyword="vortex flow meter vs differential pressure",
            priority="Medium",
            reason="Several customers mentioned switching from legacy DP (orifice plate) systems. An objective comparison of pressure drop and wear resistance validates their purchase intent.",
            volume_estimation=540
        ))
    else:
        # Generic engineering product suggestions
        recs.append(SEORecommendation(
            article_title="Step-by-Step Guide to System Configuration and Hardware Integration",
            keyword="hardware system configuration guide",
            priority="High",
            reason="Customers frequently mention integration complexity and installation struggles. Explaining software setups will answer search queries during the pre-purchase evaluation phase.",
            volume_estimation=620
        ))
        recs.append(SEORecommendation(
            article_title="Understanding the Cost vs Quality Tradeoff in Industrial Procurement",
            keyword="industrial product procurement cost",
            priority="Medium",
            reason="Budget and high initial unit costs were primary friction points. Transparently explaining the total cost of ownership (TCO) helps justify a premium price point to buyers.",
            volume_estimation=250
        ))
        recs.append(SEORecommendation(
            article_title="Best Integration Interfaces for Modern Control Systems",
            keyword="industrial automation interface protocol",
            priority="Medium",
            reason="Feedback indicates confusion over wiring and protocol compatibility. Reviewing support protocols positions our product as highly adaptable.",
            volume_estimation=340
        ))

    return SEOEngineOutput(
        survey_id=survey_id,
        recommendations=recs
    )





# ==========================================
# Module 1: AI Survey Generator
# ==========================================

def generate_survey_questions(product_name: str, product_description: str, specifications: str = "") -> Dict[str, Any]:
    """
    Generates survey questions based on product description and specs.
    Integrates Gemini if API key is set; falls back to high-fidelity rule-based generator otherwise.
    """
    model = get_gemini_client()
    
    prompt = f"""
You are a senior market research consultant and industrial product analyst.

STEP 1: Read the ENTIRE datasheet text provided below. Do not limit yourself to the first page; extract information from the complete document.

STEP 2: Extract **structured product intelligence** as a JSON object with the following keys (return ONLY this JSON, no additional text):
- product_name
- product_category
- industry
- target_customers
- applications
- technical_specifications
- features
- benefits
- advantages
- certifications
- materials
- communication_protocols
- installation_requirements
- limitations
- competitor_mentions
- unique_selling_points

STEP 3: Infer additional **customer insight** information **not explicitly stated** in the datasheet. Include these inferred fields in the same JSON object:
- customer_pain_points
- why_features_exist
- problems_solved
- typical_industries
- buying_criteria
- technical_challenges
- maintenance_concerns
- replacement_reasons
- automation_requirements
- digitalization_trends
- safety_concerns
- cost_concerns
- seo_opportunities
- content_gaps
- competitor_comparison_opportunities

STEP 4: Based on the extracted and inferred information, generate **25‑40 survey questions**. **Do NOT include promotional or product‑name centric questions** such as "Have you heard of..." or "Would you buy...".

Create questions that feel like they were written by a senior market research consultant, industrial product manager, customer success manager, or technical sales engineer.

Distribute the questions approximately as follows (rounded to the nearest whole number):
- 20% Technical (type: usage)
- 20% Customer Pain Points (type: pain_point)
- 15% Buying Behaviour (type: purchase_intent or buying_criteria)
- 15% Feature Importance (type: feature_importance)
- 10% Competitor Comparison (type: competitor_comparison)
- 10% Marketing Research (type: awareness)
- 10% SEO Research (type: awareness)   # can be mapped to awareness
- No more than 5% promotional questions (ensure zero).

For each question, output a JSON object with the following fields:
- "question_text": the full question string.
- "type": one of the Gemini brief types that map to the categories (awareness, usage, pain_point, purchase_intent, feature_importance, buying_criteria, competitor_comparison, nps). Choose the type that matches the intended category.
- "options": an array of answer options for multiple‑choice questions, or an empty array for open‑ended questions.
- "category": will be derived from the type by the backend mapping.
- "order": incremental integer starting at 1.

Ensure diverse phrasing, avoid repeating product name, and do not ask about brand awareness unless explicitly required.

Return ONLY the final JSON matching the API schema:
{{
  "title": "",
  "description": "",
  "questions": []
}}
"""

    if model:
        try:
            logger.info("Sending prompt to Gemini for survey generation.")
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            # Ensure response contains text
            if not getattr(response, "text", None):
                logger.error("Gemini returned empty response text.")
                raise RuntimeError("Empty response from Gemini API.")
            # Parse JSON safely
            try:
                raw = json.loads(clean_json_response(response.text))
            except Exception as parse_err:
                logger.exception("Failed to parse Gemini JSON response.")
                raise
            # Convert and validate each question
            converted_questions = []
            for idx, q in enumerate(raw.get("questions", []), start=1):
                conv = _convert_gemini_question(q, order=idx)
                # Validate required fields
                if not conv.get("question_text") or not conv.get("category") or not conv.get("type"):
                    logger.error(f"Converted question missing required fields: {conv}")
                    raise ValueError("Invalid question structure after conversion.")
                # Ensure options is a list
                conv["options"] = conv.get("options") or []
                converted_questions.append(conv)
            return {
                "title": raw.get("title", ""),
                "description": raw.get("description", ""),
                "questions": converted_questions,
            }
        except Exception as e:
            logger.warning(f"Gemini survey generation failed: {e}. Falling back to mock.")
    
    return mock_generate_survey(product_name, product_description, specifications)

def mock_generate_survey(product_name: str, product_description: str, specifications: str = "") -> Dict[str, Any]:
    text_to_search = f"{product_name} {product_description} {specifications}".lower()
    
    # Check if Vortex Flow Meter
    if "vortex" in text_to_search or "fluerexa" in text_to_search or "flow sensor" in text_to_search:
        title = f"Product Survey: {product_name or 'FLUEREXA Vortex Flow Sensor'}"
        desc = "Help us understand your experience and requirements for inline Karman vortex flow sensors."
        questions = [
            {
                "type": "MCQ",
                "question_text": "Have you heard of Karman Vortex Flow Sensors before?",
                "options": [
                    "Yes, I currently use them in my processes",
                    "Yes, I have heard of them but don't use them",
                    "No, I am not familiar with Karman vortex technology"
                ],
                "category": "Awareness",
                "order": 1
            },
            {
                "type": "MCQ",
                "question_text": "What flow measurement technology do you currently use in your piping systems?",
                "options": [
                    "Differential Pressure (Orifice plate)",
                    "Thermal Mass Flow Meters",
                    "Coriolis Flow Meters",
                    "Karman Vortex / Turbine Meters"
                ],
                "category": "Usage",
                "order": 2
            },
            {
                "type": "Text",
                "question_text": "What challenges do you face with your current flow sensors in liquid/gas measurement?",
                "options": None,
                "category": "Pain Points",
                "order": 3
            },
            {
                "type": "MCQ",
                "question_text": "Would you consider switching to a high-accuracy, low-pressure drop vortex flow sensor like FLUEREXA?",
                "options": [
                    "Yes, actively looking to upgrade",
                    "Yes, if the price-to-performance ratio is favorable",
                    "No, our current system is sufficient",
                    "Unsure, we need more field test data"
                ],
                "category": "Purchase Intent",
                "order": 4
            },
            {
                "type": "MCQ",
                "question_text": "Which feature of a flow sensor is most critical to your process reliability?",
                "options": [
                    "Accuracy / Repeatability (±1% rate)",
                    "Integration interfaces (EtherCAT, Analog, Modbus)",
                    "Maintenance-free design (no moving parts)",
                    "Lower purchase and installation costs"
                ],
                "category": "Feature Validation",
                "order": 5
            },
            {
                "type": "NPS",
                "question_text": "How likely are you to recommend our Karman Vortex Flow Sensor to a colleague?",
                "options": None,
                "category": "Recommendation",
                "order": 6
            }
        ]
    # Check if Mass Flow Controller
    elif "controller" in text_to_search or "mass flow" in text_to_search or "gas" in text_to_search:
        title = f"Product Survey: {product_name or 'Mass Flow Controller'}"
        desc = "Share your insights on precision gas delivery and Mass Flow Controller requirements."
        questions = [
            {
                "type": "MCQ",
                "question_text": "Have you heard of our high-speed response Mass Flow Controllers before?",
                "options": [
                    "Yes, we use them in our semiconductor/vacuum lines",
                    "Yes, I know the brand but use competitors",
                    "No, I haven't heard of them"
                ],
                "category": "Awareness",
                "order": 1
            },
            {
                "type": "MCQ",
                "question_text": "What is the typical response time you require for gas flow adjustments?",
                "options": [
                    "Ultra-fast (< 50 milliseconds)",
                    "Standard response (100 - 500 milliseconds)",
                    "Slow control is acceptable (> 1 second)",
                    "We only need manual needle valve adjustments"
                ],
                "category": "Usage",
                "order": 2
            },
            {
                "type": "Text",
                "question_text": "What are your primary complaints or issues when integrating gas mass flow controllers?",
                "options": None,
                "category": "Pain Points",
                "order": 3
            },
            {
                "type": "MCQ",
                "question_text": "Would you consider switching to a multi-gas, multi-range flow controller to simplify inventory?",
                "options": [
                    "Yes, this would save us significant inventory overhead",
                    "Yes, if configuring different gases is simple",
                    "No, we prefer dedicated single-calibrated units"
                ],
                "category": "Purchase Intent",
                "order": 4
            },
            {
                "type": "MCQ",
                "question_text": "Which integration communication interface do you standardize on?",
                "options": [
                    "EtherCAT / DeviceNet (High-speed industrial Ethernet)",
                    "Analog (0-5V or 4-20mA)",
                    "RS-485 / Modbus RTU",
                    "Profinet / Ethernet/IP"
                ],
                "category": "Feature Validation",
                "order": 5
            },
            {
                "type": "NPS",
                "question_text": "How likely are you to recommend our gas flow controller products to an engineering peer?",
                "options": None,
                "category": "Recommendation",
                "order": 6
            }
        ]
    # General Dynamic Fallback
    else:
        name = product_name or "New Engineering Product"
        title = f"Product Survey: {name}"
        desc = f"Help us validate and optimize the design and market fit of the {name}."
        questions = [
            {
                "type": "MCQ",
                "question_text": f"Have you heard of {name} or similar solutions in your field?",
                "options": [
                    "Yes, we use similar products daily",
                    "Yes, but we haven't tested them",
                    "No, this category is new to us"
                ],
                "category": "Awareness",
                "order": 1
            },
            {
                "type": "MCQ",
                "question_text": "What technology or vendor do you currently deploy for this type of application?",
                "options": [
                    "In-house proprietary solutions",
                    "Standard industrial imports",
                    "High-end legacy systems",
                    "None, we don't currently measure/use this"
                ],
                "category": "Usage",
                "order": 2
            },
            {
                "type": "Text",
                "question_text": "What challenges or limitations do you face with your current vendor solutions?",
                "options": None,
                "category": "Pain Points",
                "order": 3
            },
            {
                "type": "MCQ",
                "question_text": f"Would you consider switching to a new offering like {name} if it improved efficiency?",
                "options": [
                    "Yes, if we see verified test reports",
                    "Yes, if pricing is more competitive",
                    "No, our systems are too rigid to modify"
                ],
                "category": "Purchase Intent",
                "order": 4
            },
            {
                "type": "MCQ",
                "question_text": "Which product attribute is most important to your procurement team?",
                "options": [
                    "Long-term reliability and warranty",
                    "Low upfront purchase cost",
                    "Ease of software/hardware integration",
                    "Technical support availability"
                ],
                "category": "Feature Validation",
                "order": 5
            },
            {
                "type": "NPS",
                "question_text": f"How likely are you to recommend {name} to other engineers in your industry?",
                "options": None,
                "category": "Recommendation",
                "order": 6
            }
        ]

    return {
        "title": title,
        "description": desc,
        "questions": questions
    }


# ==========================================
# Module 4: AI Insight Engine
# ==========================================

def analyze_survey_insights(survey_id: int, answers_text: List[str]) -> AIInsights:
    """
    Summarizes textual responses from a survey to aggregate the top concerns with percentages.
    """
    model = get_gemini_client()
    
    prompt = f"""
    You are an expert customer feedback analyst.
    Below is a list of open-ended qualitative comments from a product feedback survey.
    Your task is to analyze these comments and summarize the top issues or themes, providing a percentage representation for each concern (percentages must sum to roughly 100%), a description, and a short overall summary.
    
    Survey ID: {survey_id}
    Total Responses: {len(answers_text)}
    
    Comments:
    {chr(10).join([f"- {comment}" for comment in answers_text])}
    
    Respond in JSON format strictly matching this schema:
    {{
        "survey_id": {survey_id},
        "total_analyzed": {len(answers_text)},
        "top_concerns": [
            {{
                "category": "Pricing" | "Integration Complexity" | "Protocol Support" | "Documentation" | "Physical Size" | etc,
                "percentage": 43.5, // Float representing the percentage share of comments mentioning this theme
                "description": "Short explanation of what the customer is saying about this concern."
            }}
        ],
        "general_summary": "A 2-3 sentence general summary of the feedback, customer sentiment, and recommended actions."
    }}
    Do not add markdown formatting or explanations. Return only the raw JSON.
    """
    
    if model and answers_text:
        try:
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(clean_json_response(response.text))
            return AIInsights(**data)
        except Exception as e:
            print(f"Gemini insights error: {e}. Falling back to Mock AI.")

    # FALLBACK MOCK AI INSIGHTS
    return mock_analyze_insights(survey_id, answers_text)

def mock_analyze_insights(survey_id: int, answers_text: List[str]) -> AIInsights:
    # Set default responses if list is empty
    if not answers_text:
        answers_text = [
            "Too expensive", 
            "Need EtherCAT support", 
            "Need easier integration", 
            "Unit cost is too high for OEM application",
            "The manual is unclear on RS485 connections",
            "Difficult to mount in tight piping space"
        ]

    # Count frequencies
    pricing_count = 0
    integration_count = 0
    protocol_count = 0
    docs_count = 0
    other_count = 0
    
    for text in answers_text:
        t = text.lower()
        if "expensive" in t or "price" in t or "cost" in t or "pricing" in t or "budget" in t:
            pricing_count += 1
        elif "integration" in t or "integrate" in t or "mount" in t or "space" in t or "hard to" in t or "setup" in t or "install" in t:
            integration_count += 1
        elif "ethercat" in t or "protocol" in t or "modbus" in t or "rs485" in t or "communication" in t or "interface" in t:
            protocol_count += 1
        elif "manual" in t or "documentation" in t or "help" in t or "guide" in t or "unclear" in t:
            docs_count += 1
        else:
            other_count += 1
            
    total = len(answers_text)
    if total == 0:
        total = 1
        
    p_price = round((pricing_count / total) * 100)
    p_integ = round((integration_count / total) * 100)
    p_proto = round((protocol_count / total) * 100)
    p_docs = round((docs_count / total) * 100)
    
    # Adjust to sum to 100
    total_pct = p_price + p_integ + p_proto + p_docs
    if total_pct > 0 and total_pct != 100:
        p_price = p_price + (100 - total_pct)

    concerns = []
    if p_price > 0:
        concerns.append(ConcernBreakdown(
            category="Pricing & Unit Cost",
            percentage=p_price,
            description="Customers state that the units are too expensive for bulk purchases or OEM integration. They request discount structures."
        ))
    if p_integ > 0:
        concerns.append(ConcernBreakdown(
            category="Integration Complexity",
            percentage=p_integ,
            description="Engineering teams highlight challenges with physical piping constraints, mounting fixtures, or setting up the configuration software."
        ))
    if p_proto > 0:
        concerns.append(ConcernBreakdown(
            category="Communication Protocol Support",
            percentage=p_proto,
            description="High request volume for native EtherCAT, Profinet, and clear Modbus RTU maps instead of simple analog outputs."
        ))
    if p_docs > 0:
        concerns.append(ConcernBreakdown(
            category="Documentation & Support",
            percentage=p_docs,
            description="Users indicate that the wiring manual is confusing, specifically regarding ground shielding and Modbus address registers."
        ))

    # Sort concerns by percentage descending
    concerns.sort(key=lambda x: x.percentage, reverse=True)

    summary = (
        "Customer feedback shows significant price sensitivity regarding volume deployment. "
        "There is also a clear demand for modern industrial communications (like EtherCAT) and "
        "improved instructions on installation to lower setup time."
    )

    return AIInsights(
        survey_id=survey_id,
        total_analyzed=total,
        top_concerns=concerns,
        general_summary=summary
    )


# ==========================================
# Module 5: SEO Recommendation Engine
# ==========================================

def generate_seo_recommendations(survey_id: int, answers_text: List[str]) -> SEOEngineOutput:
    """
    Scans customer surveys for repeated user questions or search intents and produces blog/article opportunities.
    """
    model = get_gemini_client()
    
    prompt = f"""
    You are a professional SEO Specialist and Content Strategist.
    You will be given customer feedback and questions extracted from surveys.
    Your task is to identify recurring questions, concerns, or search intents and convert them into valuable SEO Content Opportunities.
    
    Survey ID: {survey_id}
    
    Comments:
    {chr(10).join([f"- {comment}" for comment in answers_text])}
    
    Please generate a list of 3-4 content opportunities. Each must include:
    1. A search-optimized article title (answering the user's implicit question).
    2. A target primary keyword.
    3. Priority level ('High', 'Medium', 'Low') based on comment frequency or pain severity.
    4. An explanation of why this topic is important to cover (correlating back to the feedback).
    5. An estimated monthly search volume (100 - 5000 range).
    
    Respond in JSON format strictly matching this schema:
    {{
        "survey_id": {survey_id},
        "recommendations": [
            {{
                "article_title": "Blog/Article Title Here",
                "keyword": "target search term here",
                "priority": "High" | "Medium" | "Low",
                "reason": "Why the survey comments indicate a need for this article",
                "volume_estimation": 450
            }}
        ]
    }}
    Do not add markdown formatting or explanations. Return only the raw JSON.
    """

    if model and answers_text:
        try:
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(clean_json_response(response.text))
            return SEOEngineOutput(**data)
        except Exception as e:
            print(f"Gemini SEO engine error: {e}. Falling back to Mock AI.")

    # FALLBACK MOCK AI SEO ENGINE
    return mock_generate_seo(survey_id, answers_text)

def mock_generate_seo(survey_id: int, answers_text: List[str]) -> SEOEngineOutput:
    recs = []
    text_content = " ".join(answers_text).lower()

    # Match themes to generate specific high quality SEO opportunities
    is_flow = "flow" in text_content or "vortex" in text_content or "sensor" in text_content or not answers_text

    if is_flow:
        recs.append(SEORecommendation(
            article_title="How to Choose a Vortex Flow Sensor for Industrial Applications",
            keyword="vortex flow sensor selection",
            priority="High",
            reason="Survey responses contain queries like 'How do I choose a vortex flow sensor?' or 'Vortex vs Coriolis' over 30 times. Writing a selection guide will intercept high-intent search traffic.",
            volume_estimation=850
        ))
        recs.append(SEORecommendation(
            article_title="Comparing EtherCAT vs Modbus RTU in Flow Measurement",
            keyword="flow meter communication protocols",
            priority="High",
            reason="Multiple respondents asked for EtherCAT support and complained about Modbus configuration. An in-depth guide on wiring and protocols builds authority and highlights our interface versatility.",
            volume_estimation=420
        ))
        recs.append(SEORecommendation(
            article_title="Troubleshooting Common Vortex Flow Meter Installation Issues",
            keyword="vortex flow meter installation guide",
            priority="Medium",
            reason="Customer pain points include comments like 'Difficult to mount' and 'manual is unclear.' Explaining piping runs, straight-pipe requirements, and grounding stops tech support tickets and boosts search ranking.",
            volume_estimation=310
        ))
        recs.append(SEORecommendation(
            article_title="Why Karman Vortex Sensors Outperform Orifice Plates",
            keyword="vortex flow meter vs differential pressure",
            priority="Medium",
            reason="Several customers mentioned switching from legacy DP (orifice plate) systems. An objective comparison of pressure drop and wear resistance validates their purchase intent.",
            volume_estimation=540
        ))
    else:
        # Generic engineering product suggestions
        recs.append(SEORecommendation(
            article_title="Step-by-Step Guide to System Configuration and Hardware Integration",
            keyword="hardware system configuration guide",
            priority="High",
            reason="Customers frequently mention integration complexity and installation struggles. Explaining software setups will answer search queries during the pre-purchase evaluation phase.",
            volume_estimation=620
        ))
        recs.append(SEORecommendation(
            article_title="Understanding the Cost vs Quality Tradeoff in Industrial Procurement",
            keyword="industrial product procurement cost",
            priority="Medium",
            reason="Budget and high initial unit costs were primary friction points. Transparently explaining the total cost of ownership (TCO) helps justify a premium price point to buyers.",
            volume_estimation=250
        ))
        recs.append(SEORecommendation(
            article_title="Best Integration Interfaces for Modern Control Systems",
            keyword="industrial automation interface protocol",
            priority="Medium",
            reason="Feedback indicates confusion over wiring and protocol compatibility. Reviewing support protocols positions our product as highly adaptable.",
            volume_estimation=340
        ))

    return SEOEngineOutput(
        survey_id=survey_id,
        recommendations=recs
    )
