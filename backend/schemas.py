from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Answer Schemas
class AnswerBase(BaseModel):
    question_id: int
    answer_text: str

class AnswerCreate(AnswerBase):
    pass

class AnswerOut(AnswerBase):
    id: int
    response_id: int

    class Config:
        from_attributes = True

# Response Schemas
class ResponseBase(BaseModel):
    survey_id: int

class ResponseCreate(BaseModel):
    answers: List[AnswerCreate]

class ResponseOut(ResponseBase):
    id: int
    submitted_at: datetime
    answers: List[AnswerOut]

    class Config:
        from_attributes = True

# Question Schemas
class QuestionBase(BaseModel):
    type: str  # 'MCQ', 'Rating', 'Text', 'NPS'
    question_text: str
    options: Optional[str] = None  # JSON list
    category: str
    order: int = 0

class QuestionCreate(QuestionBase):
    pass

class QuestionOut(QuestionBase):
    id: int
    survey_id: int

    class Config:
        from_attributes = True

# Survey Schemas
class SurveyBase(BaseModel):
    title: str
    description: Optional[str] = None

class SurveyCreate(SurveyBase):
    questions: List[QuestionCreate]

class SurveyOut(SurveyBase):
    id: int
    created_at: datetime

    share_token: Optional[str] = None
    is_published: bool = False

    questions: List[QuestionOut]

    class Config:
        from_attributes = True

# AI Survey Generation Schemas
class SurveyGenerateRequest(BaseModel):
    product_name: str
    product_description: str
    specifications: Optional[str] = None

class GeneratedQuestion(BaseModel):
    type: str  # 'MCQ', 'Rating', 'Text', 'NPS'
    question_text: str
    options: Optional[List[str]] = None
    category: str
    order: int

class SurveyGenerateResponse(BaseModel):
    title: str
    description: str
    questions: List[GeneratedQuestion]

# Analytics Schemas
class RatingDistribution(BaseModel):
    value: int
    count: int

class MCQOptionCount(BaseModel):
    option: str
    count: int

class QuestionAnalytics(BaseModel):
    question_id: int
    question_text: str
    type: str
    category: str
    total_answers: int
    average_score: Optional[float] = None  # For Rating and NPS
    nps_score: Optional[float] = None     # For NPS specifically
    mcq_distribution: Optional[List[MCQOptionCount]] = None
    rating_distribution: Optional[List[RatingDistribution]] = None
    text_responses: Optional[List[str]] = None

class SurveyAnalytics(BaseModel):
    survey_id: int
    title: str
    total_responses: int
    satisfaction_score: float  # Normalized average of all rating/NPS questions, 0-100%
    nps_overall: Optional[float] = None
    questions_analytics: List[QuestionAnalytics]

# AI Insight Engine schemas
class ConcernBreakdown(BaseModel):
    category: str
    percentage: float
    description: str

class AIInsights(BaseModel):
    survey_id: int
    total_analyzed: int
    top_concerns: List[ConcernBreakdown]
    general_summary: str

# SEO Recommendation Engine schemas
class SEORecommendation(BaseModel):
    article_title: str
    keyword: str
    priority: str  # 'High', 'Medium', 'Low'
    reason: str
    volume_estimation: int

class SEOEngineOutput(BaseModel):
    survey_id: int
    recommendations: List[SEORecommendation]
