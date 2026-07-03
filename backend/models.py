import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base
class Survey(Base):
    __tablename__ = "surveys"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    share_token = Column(String, unique=True, index=True, nullable=True)
    is_published = Column(Boolean, default=False)

    questions = relationship("Question", back_populates="survey", cascade="all, delete-orphan")
    responses = relationship("Response", back_populates="survey", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    type = Column(String(50), nullable=False)  # 'MCQ', 'Rating', 'Text', 'NPS'
    question_text = Column(Text, nullable=False)
    options = Column(Text, nullable=True)        # JSON string of MCQ options, e.g., ["A", "B"]
    category = Column(String(100), nullable=False) # 'Awareness', 'Usage', 'Pain Points', 'Purchase Intent', 'Feature Validation'
    order = Column(Integer, default=0)

    survey = relationship("Survey", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)

    survey = relationship("Survey", back_populates="responses")
    answers = relationship("Answer", back_populates="response", cascade="all, delete-orphan")

class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    response_id = Column(Integer, ForeignKey("responses.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    answer_text = Column(Text, nullable=False)

    response = relationship("Response", back_populates="answers")
    question = relationship("Question", back_populates="answers")
