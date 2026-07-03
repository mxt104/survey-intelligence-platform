import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function Analytics({ surveyId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hydrating, setHydrating] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const data = await api.getAnalytics(surveyId);
      setAnalytics(data);
    } catch (err) {
      setError('Failed to fetch analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [surveyId]);

  const handleHydrate = async () => {
    setHydrating(true);
    setError('');
    try {
      await api.generateMockResponses(surveyId);
      setLoading(true);
      await load();
    } catch (err) {
      setError('Failed to generate simulation responses.');
    } finally {
      setHydrating(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)' }}>Analyzing response databases...</p>
      </div>
    );
  }

  // Sentiment pulse simulation
  const sentimentData = [
    { label: 'Positive', pct: 64.2, cls: 'secondary', color: 'var(--color-secondary)' },
    { label: 'Neutral',  pct: 28.5, cls: 'primary',   color: 'var(--color-primary)' },
    { label: 'Negative', pct: 7.3,  cls: 'error',     color: 'var(--color-error)' },
  ];

  const featurePreferences = analytics?.questions_analytics
    ?.filter(q => q.type === 'MCQ' && q.mcq_distribution?.length > 0)
    ?.slice(0, 1)
    ?.flatMap(q => q.mcq_distribution?.map(d => ({
      label: d.option,
      pct: analytics.total_responses > 0 ? Math.round((d.count / analytics.total_responses) * 100) : 0,
    }))) || [];

  if (!analytics || analytics.total_responses === 0) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div className="page-header-left">
            <h2>Analytics Dashboard</h2>
            <p>Real-time performance metrics and cross-segment insights.</p>
          </div>
        </div>
        <div className="card card-p" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', padding: 48 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 52, color: 'var(--color-outline-variant)', display: 'block', marginBottom: 16 }}>monitoring</span>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: 8 }}>No Responses Yet</h3>
          <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', marginBottom: 24, lineHeight: 1.6 }}>
            This survey has been published but has no responses. Generate 35 simulated responses to test the analytics engine.
          </p>
          <button className="btn btn-primary" id="hydrate-btn" onClick={handleHydrate} disabled={hydrating} style={{ margin: '0 auto' }}>
            {hydrating ? (
              <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Simulating...</>
            ) : (
              <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>group_add</span> Generate 35 Mock Responses</>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Analytics Dashboard</h2>
          <p>Real-time performance metrics and cross-segment insights.</p>
        </div>
        <div className="page-header-actions">
          <select className="form-select" style={{ width: 'auto', padding: '6px 32px 6px 10px' }}>
            <option>Last 30 Days</option>
            <option>Last Quarter</option>
            <option>Year to Date</option>
          </select>
          <select className="form-select" style={{ width: 'auto', padding: '6px 32px 6px 10px' }}>
            <option>All Segments</option>
            <option>Enterprise</option>
          </select>
          <button className="btn btn-secondary" id="regen-responses-btn" onClick={handleHydrate} disabled={hydrating}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
            {hydrating ? 'Generating...' : 'Regenerate'}
          </button>
          <button className="btn btn-primary" id="export-data-btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>file_download</span>
            Export Data
          </button>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 'var(--space-gutter)' }}>
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon primary"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>group</span></div>
            <span className="kpi-change positive">Live</span>
          </div>
          <div className="kpi-label">Total Responses</div>
          <div className="kpi-value">{analytics.total_responses}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon secondary"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>sentiment_satisfied</span></div>
            <span className="kpi-change positive">+2.1%</span>
          </div>
          <div className="kpi-label">Satisfaction Score</div>
          <div className="kpi-value">{analytics.satisfaction_score}%</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon tertiary"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>handshake</span></div>
            <span className={`kpi-change ${analytics.nps_overall >= 0 ? 'positive' : 'negative'}`}>
              {analytics.nps_overall !== null ? (analytics.nps_overall > 0 ? `+${analytics.nps_overall}` : analytics.nps_overall) : '--'}
            </span>
          </div>
          <div className="kpi-label">Net Promoter Score (NPS)</div>
          <div className="kpi-value">{analytics.nps_overall !== null ? Math.round(analytics.nps_overall) : 'N/A'}</div>
        </div>
      </div>

      {/* Main Grid: Response Distribution + Sentiment Pulse */}
      <div className="bento-row col-8-4" style={{ marginBottom: 'var(--space-gutter)' }}>

        {/* Response Distribution Chart */}
        <div className="card card-p" style={{ minHeight: 360 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
            <div className="card-title">Response Distribution</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-secondary)', display: 'inline-block' }} />
                <span style={{ fontSize: 11, fontWeight: 500 }}>Positive</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-block' }} />
                <span style={{ fontSize: 11, fontWeight: 500 }}>Neutral</span>
              </div>
            </div>
          </div>

          {/* Question Analytics as stacked bar chart */}
          {analytics.questions_analytics.map((qa, i) => (
            <div key={qa.question_id} style={{ marginBottom: 'var(--space-md)' }}>
              {qa.type === 'MCQ' && qa.mcq_distribution?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: 8 }}>
                    <span style={{ color: 'var(--color-primary)' }}>Q{i + 1}.</span> {qa.question_text}
                  </div>
                  {qa.mcq_distribution.map((item, idx) => {
                    const pct = analytics.total_responses > 0
                      ? ((item.count / analytics.total_responses) * 100).toFixed(0)
                      : 0;
                    return (
                      <div key={idx} className="bar-row" style={{ gridTemplateColumns: '1fr 120px 52px', marginBottom: 6 }}>
                        <div className="bar-label" style={{ fontSize: 11 }}>{item.option}</div>
                        <div className="bar-track">
                          <div className={`progress-fill ${idx % 2 === 0 ? 'secondary' : 'primary'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="bar-value" style={{ fontSize: 11 }}>{pct}% <span style={{ color: 'var(--color-on-surface-variant)', fontWeight: 400 }}>({item.count})</span></div>
                      </div>
                    );
                  })}
                </div>
              )}
              {(qa.type === 'Rating' || qa.type === 'NPS') && qa.rating_distribution?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: 8 }}>
                    <span style={{ color: 'var(--color-primary)' }}>Q{i + 1}.</span> {qa.question_text}
                    <span style={{ fontWeight: 400, color: 'var(--color-on-surface-variant)', marginLeft: 8 }}>
                      Avg: {qa.average_score?.toFixed(1)}{qa.type === 'NPS' ? '/10' : '/5'}
                    </span>
                  </div>
                  {qa.rating_distribution.slice().reverse().map((item, idx) => {
                    const pct = qa.total_answers > 0 ? ((item.count / qa.total_answers) * 100).toFixed(0) : 0;
                    const isFav = qa.type === 'NPS' ? item.value >= 9 : item.value >= 4;
                    return (
                      <div key={idx} className="bar-row" style={{ gridTemplateColumns: '56px 1fr 52px', marginBottom: 4 }}>
                        <div className="bar-label" style={{ fontSize: 11 }}>{qa.type === 'NPS' ? `Score ${item.value}` : `${item.value} ★`}</div>
                        <div className="bar-track">
                          <div className={`progress-fill ${isFav ? 'secondary' : 'primary'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="bar-value" style={{ fontSize: 11 }}>{pct}%</div>
                      </div>
                    );
                  })}
                </div>
              )}
              {qa.type === 'Text' && qa.text_responses?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: 8 }}>
                    <span style={{ color: 'var(--color-primary)' }}>Q{i + 1}.</span> {qa.question_text}
                    <span style={{ fontWeight: 400, color: 'var(--color-on-surface-variant)', marginLeft: 8 }}>
                      ({qa.text_responses.length} responses)
                    </span>
                  </div>
                  <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {qa.text_responses.slice(0, 5).map((txt, idx) => (
                      <div key={idx} style={{
                        background: 'var(--color-surface-low)',
                        border: '1px solid var(--color-outline-variant)',
                        borderRadius: 'var(--radius-md)',
                        padding: '8px 12px',
                        fontSize: 12,
                        color: 'var(--color-on-surface-variant)',
                        lineHeight: 1.4,
                      }}>
                        "{txt}"
                      </div>
                    ))}
                    {qa.text_responses.length > 5 && (
                      <span style={{ fontSize: 11, color: 'var(--color-primary)', cursor: 'pointer' }}>
                        +{qa.text_responses.length - 5} more responses
                      </span>
                    )}
                  </div>
                </div>
              )}
              {i < analytics.questions_analytics.length - 1 && (
                <hr style={{ border: 'none', borderTop: '1px solid var(--color-surface-container)', margin: 'var(--space-md) 0 0' }} />
              )}
            </div>
          ))}
        </div>

        {/* Sentiment Pulse */}
        <div className="card card-p">
          <div className="card-title" style={{ marginBottom: 'var(--space-xl)' }}>Sentiment Pulse</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            {sentimentData.map((item, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.pct}%</span>
                </div>
                <div className="progress-bar" style={{ height: 10 }}>
                  <div className={`progress-fill ${item.cls}`} style={{ width: `${item.pct}%`, boxShadow: `0 0 8px ${item.color}40` }} />
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-secondary" id="segment-analysis-btn" style={{ width: '100%', marginTop: 'var(--space-xl)', justifyContent: 'center' }}>
            Detailed Segment Analysis
          </button>

          {/* Feature Preference */}
          {featurePreferences.length > 0 && (
            <div style={{ marginTop: 'var(--space-xl)' }}>
              <div className="card-title" style={{ marginBottom: 'var(--space-md)' }}>Feature Preference</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {featurePreferences.slice(0, 4).map((fp, i) => (
                  <div key={i} className="feature-row">
                    <div className="feature-icon-box">
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: i < 2 ? 'var(--color-primary)' : 'var(--color-secondary)' }}>
                        {['auto_graph', 'database', 'security', 'api'][i] || 'star'}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-on-surface)' }}>{fp.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--color-on-surface-variant)' }}>{fp.pct}% Match</span>
                      </div>
                      <div className="progress-bar" style={{ height: 5 }}>
                        <div className={`progress-fill ${i < 2 ? 'primary' : 'secondary'}`} style={{ width: `${fp.pct}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
