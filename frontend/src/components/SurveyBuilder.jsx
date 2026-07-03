import React, { useState } from 'react';
import { api } from '../utils/api';

export default function SurveyBuilder({
  initialData,
  surveys,
  selectedSurveyId,
  setSelectedSurveyId,
  onPublishSuccess,
  onCancel
}) {
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [questions, setQuestions] = useState(
    initialData.questions.map((q, idx) => ({
      ...q,
      tempId: idx, // unique internal id for list operations
      options: q.options || []
    }))
  );
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState('');

  const handleQuestionTextChange = (tempId, text) => {
    setQuestions(questions.map(q => q.tempId === tempId ? { ...q, question_text: text } : q));
  };

  const handleTypeChange = (tempId, type) => {
    setQuestions(questions.map(q => {
      if (q.tempId === tempId) {
        // Hydrate default options if switched to MCQ and currently empty
        let opts = q.options;
        if (type === 'MCQ' && opts.length === 0) {
          opts = ['Option 1', 'Option 2', 'Option 3'];
        }
        return { ...q, type, options: type === 'MCQ' ? opts : null };
      }
      return q;
    }));
  };

  const handleCategoryChange = (tempId, category) => {
    setQuestions(questions.map(q => q.tempId === tempId ? { ...q, category } : q));
  };

  const handleOptionChange = (tempId, optionIdx, value) => {
    setQuestions(questions.map(q => {
      if (q.tempId === tempId) {
        const newOpts = [...q.options];
        newOpts[optionIdx] = value;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const addOption = (tempId) => {
    setQuestions(questions.map(q => {
      if (q.tempId === tempId) {
        return { ...q, options: [...(q.options || []), `New Option ${q.options.length + 1}`] };
      }
      return q;
    }));
  };

  const removeOption = (tempId, optionIdx) => {
    setQuestions(questions.map(q => {
      if (q.tempId === tempId) {
        const newOpts = q.options.filter((_, idx) => idx !== optionIdx);
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const addCustomQuestion = () => {
    const nextTempId = questions.reduce((max, q) => Math.max(max, q.tempId), 0) + 1;
    const newQ = {
      tempId: nextTempId,
      type: 'Rating',
      question_text: 'Describe your feedback on...',
      options: null,
      category: 'Feature Validation',
      order: questions.length
    };
    setQuestions([...questions, newQ]);
  };

  const deleteQuestion = (tempId) => {
    setQuestions(questions.filter(q => q.tempId !== tempId));
  };

  const moveQuestion = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setQuestions(updated);
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      setError('Please provide a survey title.');
      return;
    }
    if (questions.length === 0) {
      setError('A survey must contain at least one question.');
      return;
    }

    setIsPublishing(true);
    setError('');

    try {
      const payload = {
        title,
        description,
        questions: questions.map((q, idx) => ({
          type: q.type,
          question_text: q.question_text,
          options: q.type === 'MCQ' ? JSON.stringify(q.options) : null,
          category: q.category,
          order: idx
        }))
      };

      const publishedSurvey = await api.createSurvey(payload);
      onPublishSuccess(publishedSurvey.id);
    } catch (err) {
      setError(err.message || 'Failed to publish survey. Make sure python backend is running.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Survey Builder</h2>
          <p>Refine your generated questions, customize parameters, and publish your survey.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={isPublishing}>
            Cancel
          </button>
          <button className="btn btn-primary" id="publish-survey-top-btn" onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? 'Publishing...' : 'Publish Survey'}
            {!isPublishing && <span className="material-symbols-outlined" style={{ fontSize: 16 }}>publish</span>}
          </button>
        </div>
      </div>

      {error && (
        <div className="card card-p" style={{ background: 'var(--color-error-container)', borderColor: 'rgba(186,26,26,0.3)', color: 'var(--color-on-error-container)', marginBottom: 'var(--space-lg)' }}>
          {error}
        </div>
      )}
      <div
        className="card card-p"
        style={{ marginBottom: "24px" }}
      >
        <h3>Published Surveys</h3>

        {surveys.length === 0 ? (
          <p>No surveys published yet.</p>
        ) : (
          surveys.map((survey) => (
            <div
              key={survey.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "12px",
                marginTop: "10px",
                display: "flex",
                justifyContent: "space-between"
              }}
            >
              <div>
                <strong>{survey.title}</strong>
                <div>{survey.description}</div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {survey.share_token && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/s/${survey.share_token}`
                      );
                      alert("Survey link copied!");
                    }}
                  >
                    Copy Link
                  </button>
                )}

                <button
                  className="btn btn-primary"
                  onClick={() =>
                    setSelectedSurveyId(survey.id)
                  }
                >
                  Select
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card card-p" style={{ marginBottom: 'var(--space-xl)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-primary)' }}>description</span>
          Survey Metadata
        </h3>
        <div className="form-group">
          <label className="form-label">Survey Title</label>
          <input
            type="text"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Feedback on Karman Vortex Flow Sensor"
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Survey Description</label>
          <textarea
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. We want to understand what integration challenges you face..."
            style={{ minHeight: '80px' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Questions ({questions.length})</h3>
        <button className="btn btn-secondary btn-sm" id="add-question-btn" onClick={addCustomQuestion}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
          Add Custom Question
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {questions.map((q, index) => (
          <div className="card card-p" key={q.tempId}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-outline)' }}>#{index + 1}</span>
                <span className="badge badge-primary">{q.category}</span>
              </div>

              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-secondary btn-sm" style={{ padding: '4px 6px' }} onClick={() => moveQuestion(index, 'up')} disabled={index === 0}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_upward</span>
                </button>
                <button className="btn btn-secondary btn-sm" style={{ padding: '4px 6px' }} onClick={() => moveQuestion(index, 'down')} disabled={index === questions.length - 1}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_downward</span>
                </button>
                <button className="btn btn-danger btn-sm" style={{ padding: '4px 6px', marginLeft: 4 }} onClick={() => deleteQuestion(q.tempId)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-md)', marginBottom: q.type === 'MCQ' ? 'var(--space-md)' : 0 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Question Text</label>
                <input
                  type="text"
                  className="form-input"
                  value={q.question_text}
                  onChange={(e) => handleQuestionTextChange(q.tempId, e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Question Type</label>
                <select className="form-select" value={q.type} onChange={(e) => handleTypeChange(q.tempId, e.target.value)}>
                  <option value="MCQ">Multiple Choice (MCQ)</option>
                  <option value="Rating">Rating Scale (1-5)</option>
                  <option value="Text">Open Text Input</option>
                  <option value="NPS">Net Promoter Score (NPS 0-10)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Target Category</label>
                <select className="form-select" value={q.category} onChange={(e) => handleCategoryChange(q.tempId, e.target.value)}>
                  <option value="Awareness">Awareness</option>
                  <option value="Usage">Usage</option>
                  <option value="Pain Points">Pain Points</option>
                  <option value="Purchase Intent">Purchase Intent</option>
                  <option value="Feature Validation">Feature Validation</option>
                  <option value="Recommendation">Recommendation</option>
                </select>
              </div>
            </div>

            {q.type === 'MCQ' && q.options && (
              <div style={{ background: 'var(--color-surface-low)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-surface-container)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                  <label className="form-label" style={{ color: 'var(--color-primary)', marginBottom: 0, fontWeight: 600 }}>MCQ Choices</label>
                  <button className="btn btn-secondary btn-sm" style={{ padding: '2px 8px' }} onClick={() => addOption(q.tempId)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span> Add Choice
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-sm)' }}>
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} style={{ display: 'flex', alignItems: 'center', background: 'var(--color-surface-lowest)', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                      <input
                        type="text"
                        style={{ flex: 1, border: 'none', background: 'none', padding: '6px 10px', fontSize: 12, outline: 'none', color: 'var(--color-on-surface)' }}
                        value={opt}
                        onChange={(e) => handleOptionChange(q.tempId, optIdx, e.target.value)}
                      />
                      {q.options.length > 2 && (
                        <button style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', padding: '6px' }} onClick={() => removeOption(q.tempId, optIdx)}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'var(--space-2xl)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-md)' }}>
        {error && (
          <div style={{ color: 'var(--color-error)', fontSize: 13, fontWeight: 500 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }}>warning</span>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button className="btn btn-secondary" onClick={onCancel} disabled={isPublishing}>
            Cancel
          </button>
          <button className="btn btn-primary btn-lg" id="publish-survey-bottom-btn" onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? 'Publishing...' : 'Publish Survey'}
          </button>
        </div>
      </div>
    </div>
  );
}
