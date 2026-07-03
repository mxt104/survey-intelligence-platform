import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function AIInsights({ surveyId, surveyTitle }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getInsights(surveyId);
        setInsights(data);
      } catch (err) {
        setError('Failed to fetch AI insights. Ensure the survey has text responses.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [surveyId]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)' }}>AI Insight Engine analyzing qualitative responses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div className="page-header-left">
            <h2>AI Insight Engine</h2>
            <p>Aggregates qualitative text comments into clear business themes.</p>
          </div>
        </div>
        <div className="card card-p" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', padding: 48 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 52, color: 'var(--color-outline)', display: 'block', marginBottom: 16 }}>warning</span>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: 8 }}>No Feedback Data</h3>
          <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', lineHeight: 1.6 }}>
            The AI Insight Engine requires text responses. Go to <strong>Analytics</strong> and click 
            "Generate Mock Responses" to populate the database with realistic qualitative feedback.
          </p>
        </div>
      </div>
    );
  }

  const priority1Color = 'var(--color-error)';
  const priority2Color = 'var(--color-secondary)';
  const priority3Color = 'var(--color-tertiary)';

  const getConcernColor = (idx) => {
    if (idx === 0) return priority1Color;
    if (idx === 1) return priority2Color;
    return priority3Color;
  };

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>AI Insight Engine</h2>
          <p>Aggregates qualitative text comments into clear business themes and concern breakdowns.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" id="export-insights-btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
            Export Report
          </button>
          <button className="btn btn-primary" id="refresh-insights-btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>sync</span>
            Refresh Analysis
          </button>
        </div>
      </div>

      {/* Executive Summary Card */}
      <div className="card card-p" style={{ marginBottom: 'var(--space-gutter)', background: 'linear-gradient(135deg, rgba(53,37,205,0.03), rgba(255,255,255,1))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
          <span className="material-symbols-outlined filled" style={{ color: 'var(--color-primary)', fontSize: 20 }}>auto_awesome</span>
          <span className="card-title">Executive Sentiment Summary</span>
          <span className="badge badge-primary" style={{ marginLeft: 'auto' }}>
            {insights.total_analyzed} responses analyzed
          </span>
        </div>
        <p style={{ fontSize: 14, color: 'var(--color-on-surface)', lineHeight: 1.65 }}>
          {insights.general_summary}
        </p>
      </div>

      {/* Bento Grid: Concerns + Insight Details */}
      <div className="bento-row col-7-5" style={{ marginBottom: 'var(--space-gutter)' }}>

        {/* Feedback Category Breakdown */}
        <div className="card card-p">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 18 }}>psychology</span>
            <div className="card-title">Feedback Category Breakdown</div>
            <span style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', marginLeft: 4 }}>
              ({insights.top_concerns.length} categories)
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {insights.top_concerns.map((concern, idx) => (
              <div key={idx} className="concern-item">
                <div className="concern-pct" style={{
                  background: `rgba(${idx === 0 ? '186,26,26' : idx === 1 ? '0,107,95' : '65,72,94'}, 0.06)`,
                  borderColor: `rgba(${idx === 0 ? '186,26,26' : idx === 1 ? '0,107,95' : '65,72,94'}, 0.12)`,
                }}>
                  <div className="concern-pct-num" style={{ color: getConcernColor(idx) }}>
                    {Math.round(concern.percentage)}%
                  </div>
                  <div className="concern-pct-label">Share</div>
                </div>
                <div>
                  <div className="concern-title">{concern.category}</div>
                  <div className="concern-desc">{concern.description}</div>
                  <div className="progress-bar" style={{ height: 4, marginTop: 8, maxWidth: 280 }}>
                    <div className={`progress-fill ${idx === 0 ? 'error' : idx === 1 ? 'secondary' : 'tertiary'}`}
                      style={{ width: `${concern.percentage}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Insights Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Priority indicators */}
          {insights.top_concerns.slice(0, 3).map((concern, idx) => {
            const colors = [
              { bg: 'rgba(186,26,26,0.04)', border: 'rgba(186,26,26,0.1)', dot: 'var(--color-error)', label: 'var(--color-on-error-container)', tag: 'HIGH PRIORITY' },
              { bg: 'rgba(0,107,95,0.04)', border: 'rgba(0,107,95,0.1)', dot: 'var(--color-secondary)', label: 'var(--color-on-secondary-container)', tag: 'MEDIUM PRIORITY' },
              { bg: 'rgba(65,72,94,0.04)', border: 'rgba(65,72,94,0.1)', dot: 'var(--color-tertiary)', label: 'var(--color-on-tertiary-fixed-variant)', tag: 'MARKET TREND' },
            ][idx];

            return (
              <div key={idx} className="card card-p" style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                boxShadow: 'none',
              }}>
                <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.dot, marginTop: 4, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.label, marginBottom: 4 }}>
                      {colors.tag}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-on-surface)', lineHeight: 1.5 }}>
                      {concern.description}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <span className="badge badge-neutral" style={{ fontSize: 10 }}>{concern.category}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Analysis metadata */}
          <div className="card card-p" style={{ background: 'var(--color-surface-low)', border: '1px solid var(--color-outline-variant)', boxShadow: 'none' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-sm)' }}>
              Analysis Metadata
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--color-on-surface-variant)' }}>Responses Analyzed</span>
                <span style={{ fontWeight: 600, color: 'var(--color-on-surface)' }}>{insights.total_analyzed}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--color-on-surface-variant)' }}>Categories Found</span>
                <span style={{ fontWeight: 600, color: 'var(--color-on-surface)' }}>{insights.top_concerns.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--color-on-surface-variant)' }}>AI Engine</span>
                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>InsightEngine™ V4.2</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="page-footer">
        <span>Powered by <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>InsightEngine™</span> AI V4.2</span>
        <div className="footer-links">
          <span>System Status: Online</span>
          <span>Data Privacy Policy</span>
        </div>
      </div>
    </div>
  );
}
