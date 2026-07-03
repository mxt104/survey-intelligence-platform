import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function SurveyTake({ surveyId, onBackToList }) {
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState({}); // questionId -> answer text
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSurvey() {
      try {
        const data = await api.getSurvey(surveyId);
        setSurvey(data);
        // Initialize state
        const initial = {};
        data.questions.forEach(q => {
          initial[q.id] = '';
        });
        setResponses(initial);
      } catch (err) {
        setError('Failed to load survey. Make sure python backend is running.');
      } finally {
        setLoading(false);
      }
    }
    loadSurvey();
  }, [surveyId]);

  const handleSelectOption = (questionId, value) => {
    setResponses({ ...responses, [questionId]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that all questions are answered
    const unanswered = survey.questions.filter(q => !responses[q.id] || responses[q.id].trim() === '');
    if (unanswered.length > 0) {
      setError('Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const answersPayload = Object.keys(responses).map(qId => ({
        question_id: parseInt(qId),
        answer_text: responses[qId]
      }));

      await api.submitResponse(surveyId, answersPayload);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)' }}>Loading Survey Questionnaire...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="fade-in" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="card card-p" style={{ padding: '48px 32px', borderColor: 'var(--color-secondary)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--color-secondary)', display: 'block', margin: '0 auto 16px' }}>check_circle</span>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 12 }}>
            Thank You!
          </h1>
          <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
            Your feedback has been successfully captured. The AI insight engine will now process your responses to improve product quality and SEO relevance.
          </p>
          <button className="btn btn-primary" onClick={onBackToList}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: 'var(--space-2xl)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)', marginTop: 'var(--space-lg)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 42, color: 'var(--color-primary)', margin: '0 auto 16px', display: 'block' }}>assignment</span>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: 12, letterSpacing: '-0.02em' }}>{survey.title}</h1>
        {survey.description && <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 14, maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>{survey.description}</p>}
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="card card-p" style={{ background: 'var(--color-error-container)', borderColor: 'rgba(186,26,26,0.3)', color: 'var(--color-on-error-container)', marginBottom: 'var(--space-lg)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {survey.questions.map((q, index) => {
            let optionsList = [];
            if (q.type === 'MCQ' && q.options) {
              try {
                optionsList = JSON.parse(q.options);
              } catch {
                optionsList = [];
              }
            }

            return (
              <div className="card card-p" key={q.id}>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: 'var(--space-md)' }}>
                  <span style={{ color: 'var(--color-primary)', marginRight: 8 }}>Q{index + 1}.</span>
                  {q.question_text}
                </div>

                {q.type === 'MCQ' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {optionsList.map((opt, optIdx) => (
                      <label
                        key={optIdx}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 16px',
                          border: `1px solid ${responses[q.id] === opt ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                          borderRadius: 'var(--radius-md)',
                          background: responses[q.id] === opt ? 'var(--color-primary-fixed)' : 'var(--color-surface-lowest)',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          value={opt}
                          checked={responses[q.id] === opt}
                          onChange={() => handleSelectOption(q.id, opt)}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <span style={{ fontSize: 14, color: responses[q.id] === opt ? 'var(--color-on-primary-fixed)' : 'var(--color-on-surface)' }}>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'Rating' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[1, 2, 3, 4, 5].map(val => (
                      <button
                        key={val}
                        type="button"
                        style={{
                          flex: 1,
                          padding: '16px 0',
                          border: `1px solid ${responses[q.id] === String(val) ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                          borderRadius: 'var(--radius-md)',
                          background: responses[q.id] === String(val) ? 'var(--color-primary-container)' : 'var(--color-surface-lowest)',
                          color: responses[q.id] === String(val) ? 'var(--color-on-primary)' : 'var(--color-on-surface)',
                          fontSize: 16,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        onClick={() => handleSelectOption(q.id, String(val))}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'NPS' && (
                  <div>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                      {Array.from({ length: 11 }, (_, i) => i).map(val => (
                        <button
                          key={val}
                          type="button"
                          style={{
                            flex: 1,
                            padding: '12px 0',
                            border: `1px solid ${responses[q.id] === String(val) ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                            borderRadius: 'var(--radius-sm)',
                            background: responses[q.id] === String(val) ? 'var(--color-primary-container)' : 'var(--color-surface-lowest)',
                            color: responses[q.id] === String(val) ? 'var(--color-on-primary)' : 'var(--color-on-surface)',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onClick={() => handleSelectOption(q.id, String(val))}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-on-surface-variant)' }}>
                      <span>Not likely at all (0)</span>
                      <span>Extremely likely (10)</span>
                    </div>
                  </div>
                )}

                {q.type === 'Text' && (
                  <textarea
                    className="form-textarea"
                    placeholder="Type your response detailed here..."
                    value={responses[q.id] || ''}
                    onChange={(e) => handleSelectOption(q.id, e.target.value)}
                    style={{ minHeight: '120px' }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-md)', marginTop: 'var(--space-xl)' }}>
          <button type="button" className="btn btn-secondary" onClick={onBackToList} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? 'Submitting Answers...' : 'Submit Answers'}
          </button>
        </div>
      </form>
    </div>
  );
}
