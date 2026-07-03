import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function SEOEngine({ surveyId }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSEO() {
      try {
        const data = await api.getSEO(surveyId);
        setRecommendations(data.recommendations);
      } catch (err) {
        setError('Failed to fetch SEO recommendations. Check if backend database contains responses.');
      } finally {
        setLoading(false);
      }
    }
    loadSEO();
  }, [surveyId]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)' }}>SEO Engine mapping keyword search intent...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div className="page-header-left">
            <h2>SEO Recommendation Engine</h2>
            <p>Translates customer survey queries into high-performing search topics.</p>
          </div>
        </div>
        <div className="card card-p" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: 48, borderColor: 'var(--color-error)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 52, color: 'var(--color-error)', display: 'block', marginBottom: 16 }}>warning</span>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: 8 }}>No Search Intent Extracted</h3>
          <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', marginBottom: 24, lineHeight: 1.6 }}>
            The SEO Recommendation Engine requires text survey responses to identify keywords and questions customers care about.
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-outline)' }}>
            Please generate mock responses in the Analytics tab first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>SEO Intelligence Center</h2>
          <p>Translates customer survey queries into high-performing search engine topics.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" id="export-seo-btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
            Export CSV
          </button>
        </div>
      </div>

      <div className="card card-p" style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start', marginBottom: 'var(--space-lg)', background: 'rgba(0,107,95,0.04)', borderColor: 'rgba(0,107,95,0.1)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--color-secondary)' }}>lightbulb</span>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: 4 }}>Why Survey-Driven SEO Wins</h3>
          <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', lineHeight: 1.6 }}>
            Traditional tools show search volumes, but this engine reveals exactly what questions your actual prospects are asking. By writing guides that directly address these pain points, you capture highly qualified organic traffic that converts.
          </p>
        </div>
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-primary)' }}>search_insights</span>
        Content & Blog Opportunities ({recommendations.length})
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-md)' }}>
        {recommendations.map((rec, idx) => {
          let badgeClass = 'badge-steady';
          if (rec.priority === 'High') badgeClass = 'badge-critical';
          if (rec.priority === 'Medium') badgeClass = 'badge-quick-win';

          return (
            <div className="card" key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-header" style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                <span className={`badge ${badgeClass}`}>{rec.priority} Priority</span>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: rec.priority === 'High' ? 'var(--color-error)' : 'var(--color-outline)' }}>trending_up</span>
              </div>
              <div style={{ padding: 'var(--space-md)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: 8, lineHeight: 1.4 }}>{rec.article_title}</h4>
                <div style={{ background: 'var(--color-surface-low)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 500, color: 'var(--color-on-surface)', marginBottom: 12 }}>
                  <span style={{ color: 'var(--color-on-surface-variant)', fontWeight: 400, marginRight: 4 }}>Target Keyword:</span> 
                  {rec.keyword}
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', lineHeight: 1.5, marginBottom: 'var(--space-md)', flex: 1 }}>{rec.reason}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-surface-container)', paddingTop: 'var(--space-sm)', marginTop: 'auto' }}>
                  <span style={{ fontSize: 11, color: 'var(--color-on-surface-variant)' }}>Est. Search Volume</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>{rec.volume_estimation} / mo</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
