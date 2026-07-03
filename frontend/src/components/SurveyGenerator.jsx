import React, { useState, useRef } from 'react';
import { api } from '../utils/api';

const TARGET_AUDIENCES = [
  'IT Decision Makers (Enterprise)',
  'DevOps Engineers',
  'System Architects',
  'Operations Managers',
  'C-Suite Executives',
  'Product Managers',
  'Industrial Engineers',
];

const SUGGESTED_TAGS = ['Accuracy', 'Integration', 'Cost', 'Performance', 'Reliability', 'Support'];

export default function SurveyGenerator({ onGenerationSuccess }) {
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [audience, setAudience] = useState('IT Decision Makers (Enterprise)');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [qualityScore] = useState(98);
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') { setFile(f); setError(''); }
    else setError('Only PDF files are supported.');
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f?.type === 'application/pdf') { setFile(f); setError(''); }
    else if (f) setError('Only PDF files are supported.');
  };

  const addTag = (tag) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
  };

  const removeTag = (tag) => setTags(tags.filter(t => t !== tag));

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
      setTagInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productName.trim() || !description.trim()) {
      setError('Product Name and Description are required.');
      return;
    }
    setIsGenerating(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('product_name', productName);
      formData.append('product_description', description);
      if (specifications) formData.append('specifications', specifications + (tags.length ? `\nKey features: ${tags.join(', ')}` : ''));
      if (file) formData.append('file', file);
      const result = await api.generateSurvey(formData);
      onGenerationSuccess(result);
    } catch (err) {
      setError(err.message || 'Generation failed. Ensure the Python backend is running.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>AI Survey Generator</h2>
          <p>Upload a product datasheet or enter details to automatically generate customer validation surveys.</p>
        </div>
        <div className="page-header-actions">
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>visibility</span>
              LIVE PREVIEW
            </button>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span>
              EXPORT
            </button>
            <button className="btn btn-primary btn-sm" style={{ fontSize: 11 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>send</span>
              PUBLISH
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 'var(--space-lg)', alignItems: 'start' }}>

        {/* ===== LEFT COLUMN ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

          {/* Datasheet Upload */}
          <div className="card card-p">
            <div className="card-title" style={{ marginBottom: 'var(--space-md)' }}>Datasheet Upload</div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".pdf"
              onChange={handleFileChange}
            />
            <div
              className={`dropzone ${isDragging ? 'dragover' : ''} ${file ? 'selected' : ''}`}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
              id="pdf-dropzone"
            >
              <span className="material-symbols-outlined dropzone-icon">
                {file ? 'description' : 'upload_file'}
              </span>
              {file ? (
                <>
                  <h4>{file.name}</h4>
                  <p>PDF loaded · {(file.size / 1024).toFixed(1)} KB</p>
                </>
              ) : (
                <>
                  <h4>Drag and drop product datasheets</h4>
                  <p>PDF, DOCX up to 10MB</p>
                </>
              )}
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 8, pointerEvents: 'none' }}
              >
                {file ? 'Change File' : 'Select File'}
              </button>
            </div>
          </div>

          {/* Product Intelligence Form */}
          <div className="card card-p">
            <div className="card-title" style={{ marginBottom: 'var(--space-md)' }}>Product Intelligence</div>
            <form onSubmit={handleSubmit} id="survey-gen-form">
              {error && (
                <div className="error-alert" style={{ marginBottom: 'var(--space-md)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="product-name">Product Name *</label>
                <input
                  id="product-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. FLUEREXA Vortex Flow Sensor"
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  disabled={isGenerating}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="target-audience">Target Audience</label>
                <select
                  id="target-audience"
                  className="form-select"
                  value={audience}
                  onChange={e => setAudience(e.target.value)}
                  disabled={isGenerating}
                >
                  {TARGET_AUDIENCES.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="product-desc">Product Description *</label>
                <textarea
                  id="product-desc"
                  className="form-textarea"
                  placeholder="Describe the product, its key value propositions, target market, and application space..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={isGenerating}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Key Features</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {tags.map(tag => (
                    <span key={tag} className="tag">
                      {tag}
                      <span className="material-symbols-outlined tag-remove" onClick={() => removeTag(tag)} style={{ fontSize: 14 }}>close</span>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="+ Add Tag"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    style={{
                      border: '1px solid var(--color-outline-variant)',
                      borderRadius: 'var(--radius-full)',
                      padding: '3px 10px',
                      fontSize: 11,
                      fontFamily: 'inherit',
                      color: 'var(--color-outline)',
                      outline: 'none',
                      background: 'none',
                      minWidth: 80,
                    }}
                    disabled={isGenerating}
                    id="tag-input"
                  />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {SUGGESTED_TAGS.filter(t => !tags.includes(t)).map(t => (
                    <button key={t} type="button" className="btn-ghost btn-sm"
                      style={{ fontSize: 10, padding: '2px 8px', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-full)', color: 'var(--color-outline)' }}
                      onClick={() => addTag(t)}>
                      + {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="specifications">Technical Specifications (Optional)</label>
                <textarea
                  id="specifications"
                  className="form-textarea"
                  style={{ minHeight: 72 }}
                  placeholder="Accuracy, dimensions, interface protocols, pressure range, etc."
                  value={specifications}
                  onChange={e => setSpecifications(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isGenerating}
                id="generate-btn"
                style={{ width: '100%', padding: '12px', fontSize: 14, justifyContent: 'center', boxShadow: '0 4px 12px rgba(79,70,229,0.2)' }}
              >
                {isGenerating ? (
                  <>
                    <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    Analyzing &amp; Generating...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>auto_awesome</span>
                    Regenerate Survey
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quality Score */}
          <div className="card card-p">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <div className="card-title">Quality Score</div>
              <span className="badge badge-success" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>OPTIMIZED</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
              {/* Circular progress */}
              <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                <svg viewBox="0 0 72 72" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="36" cy="36" r="30" fill="none" stroke="var(--color-surface-high)" strokeWidth="7" />
                  <circle cx="36" cy="36" r="30" fill="none" stroke="var(--color-primary-container)" strokeWidth="7"
                    strokeDasharray={`${Math.PI*2*30*(qualityScore/100)} ${Math.PI*2*30}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'var(--color-on-surface)' }}>
                  {qualityScore}%
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-primary)', marginBottom: 4 }}>
                  <span className="material-symbols-outlined filled" style={{ fontSize: 14 }}>verified</span>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI CONFIDENCE</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', lineHeight: 1.4 }}>
                  High relevance to uploaded datasheet and target audience.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===== RIGHT COLUMN: Preview Panel ===== */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <div>
              <div className="section-title" style={{ marginBottom: 4 }}>Generated Questions Preview</div>
              <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>
                Fill out the form and click <strong>Regenerate Survey</strong> to see AI-generated questions here.
                Then go to <strong>Survey Builder</strong> to customize and publish.
              </p>
            </div>
          </div>

          {/* Placeholder question cards matching design */}
          {[
            { type: 'NET PROMOTER SCORE', text: 'How likely are you to recommend this product to a colleague?', typeColor: 'var(--color-primary)' },
            { type: 'MULTIPLE CHOICE', text: 'Which feature is most critical for your application?', typeColor: 'var(--color-primary)', options: ['Option A', 'Option B', 'Option C'] },
            { type: 'RATING SCALE', text: 'Rate the clarity of the documentation provided.', typeColor: 'var(--color-primary)' },
            { type: 'OPEN TEXT', text: 'What challenges do you face with your current solution?', typeColor: 'var(--color-primary)' },
          ].map((q, i) => (
            <div key={i} className="card card-p" style={{ marginBottom: 'var(--space-md)', opacity: 0.55, border: '1px dashed var(--color-outline-variant)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: q.typeColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{q.type}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="icon-btn" style={{ width: 24, height: 24 }} title="Drag">
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>drag_indicator</span>
                  </button>
                  <button className="icon-btn" style={{ width: 24, height: 24 }} title="Edit">
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-on-surface)', marginBottom: q.options ? 'var(--space-sm)' : 0 }}>{q.text}</p>
              {q.options && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {q.options.map((opt, j) => (
                    <div key={j} className="radio-option">
                      <div className="radio-circle" />
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button
            className="btn btn-secondary"
            style={{ width: '100%', border: '2px dashed var(--color-outline-variant)', justifyContent: 'center', padding: 14, color: 'var(--color-on-surface-variant)' }}
          >
            <span className="material-symbols-outlined">add_circle</span>
            Add Custom Question
          </button>
        </div>
      </div>
    </div>
  );
}
