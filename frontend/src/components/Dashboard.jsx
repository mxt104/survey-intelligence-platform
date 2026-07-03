import React from 'react';
import { api } from '../utils/api';

const WEEK_BARS = [
  { label: 'Wk 1', height: '30%', value: '4.2k' },
  { label: 'Wk 2', height: '45%', value: '5.8k' },
  { label: 'Wk 3', height: '38%', value: '5.1k' },
  { label: 'Wk 4', height: '62%', value: '8.4k' },
  { label: 'Wk 5', height: '52%', value: '7.2k' },
  { label: 'Wk 6', height: '78%', value: '10.1k' },
  { label: 'Current', height: '95%', value: null, isActive: true },
];

const AI_INSIGHTS = [
  {
    priority: 'HIGH PRIORITY',
    text: '43% of respondents need guidance selecting the correct flow sensor.',
    cls: 'priority-high',
    dotColor: 'var(--color-error)',
    labelColor: 'var(--color-on-error-container)',
  },
  {
    priority: 'CONTENT OPPORTUNITY',
    text: 'Mass Flow Controller selection appears in 37% of customer questions.',
    cls: 'priority-medium',
    dotColor: 'var(--color-secondary)',
    labelColor: 'var(--color-on-secondary-container)',
  },
  {
    priority: 'SEO OPPORTUNITY',
    text: 'Industrial flow sensor related searches show high demand and low visibility.',
    cls: 'priority-low',
    dotColor: 'var(--color-tertiary)',
    labelColor: 'var(--color-on-tertiary-fixed-variant)',
  },
];

const RECENT_ACTIVITY = [
  { initials: 'JD', name: 'Jane Doe', bg: 'rgba(53,37,205,0.08)', color: 'var(--color-primary)', survey: 'Q4 Product Satisfaction', sentiment: 'Positive', sentCls: 'badge-positive', time: '2 mins ago' },
  { initials: 'ML', name: 'Mike Lawson', bg: 'var(--color-tertiary-fixed)', color: 'var(--color-on-tertiary-fixed-variant)', survey: 'Customer Onboarding v2', sentiment: 'Neutral', sentCls: 'badge-neutral', time: '14 mins ago' },
  { initials: 'SK', name: 'Sarah Khan', bg: 'rgba(0,107,95,0.12)', color: 'var(--color-secondary)', survey: 'Fintech Pulse Check', sentiment: 'Critical', sentCls: 'badge-critical', time: '45 mins ago' },
  { initials: 'BT', name: 'Ben Taylor', bg: 'var(--color-primary-fixed)', color: 'var(--color-primary)', survey: 'Retail Experience Study', sentiment: 'Positive', sentCls: 'badge-positive', time: '1 hour ago' },
];

export default function Dashboard({
  surveys, selectedSurveyId, setSelectedSurveyId,
  loading, onDelete, onFillSurvey, onOpenAnalytics, onCreateNew, onOpenInsights
}) {
  const totalResponses = surveys.reduce((a, _) => a + 0, 0); // placeholder

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Executive Dashboard</h2>
          <p>Transform product datasheets into customer insights,
            SEO opportunities, and marketing content recommendations.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" id="date-range-btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>calendar_today</span>
            Last 30 Days
          </button>
          <button className="btn btn-primary" id="export-report-btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
            Export Report
          </button>
        </div>
      </div>
      <div
        className="card card-p"
        style={{ marginBottom: "24px" }}
      >
        <h3>Platform Workflow</h3>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "20px",
            fontWeight: "600"
          }}
        >
          <span>Datasheet</span>
          <span>→</span>
          <span>Survey</span>
          <span>→</span>
          <span>Insights</span>
          <span>→</span>
          <span>SEO</span>
          <span>→</span>
          <span>Content</span>
        </div>
      </div>
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon primary">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>fact_check</span>
            </div>
            <span className="kpi-change positive">+12%</span>
          </div>
          <div className="kpi-label">Total Surveys</div>
          <div className="kpi-value">{surveys.length > 0 ? surveys.length.toLocaleString() : '0'}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon secondary">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>forum</span>
            </div>
            <span className="kpi-change positive">+5.4%</span>
          </div>
          <div className="kpi-label">Customer Responses</div>
          <div className="kpi-value">42,903</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon primary">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>sentiment_very_satisfied</span>
            </div>
            <span className="kpi-change negative">-0.5%</span>
          </div>
          <div className="kpi-label">Purchase Intent</div>
          <div className="kpi-value">88%</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon tertiary">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>verified_user</span>
            </div>
            <span className="kpi-change positive">+4</span>
          </div>
          <div className="kpi-label">Content Opportunities</div>
          <div className="kpi-value">72</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon secondary">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>search_insights</span>
            </div>
            <span className="kpi-change positive">+2.1%</span>
          </div>
          <div className="kpi-label">SEO Score</div>
          <div className="kpi-value">82</div>
        </div>
      </div>

      {/* Middle Row: Chart + AI Insights */}
      <div className="bento-row col-8-4" style={{ marginBottom: 'var(--space-gutter)' }}>

        {/* Response Volume Trend */}
        <div className="card card-p" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
            <div>
              <div className="card-title">Response Volume Trend</div>
              <p style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', marginTop: 3 }}>Weekly survey engagement growth across all channels</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-block' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-on-surface-variant)', letterSpacing: '0.06em' }}>RESPONSES</span>
            </div>
          </div>

          {/* Bar Chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, height: 200, padding: '0 var(--space-md)', marginBottom: 'var(--space-sm)' }}>
            {WEEK_BARS.map((bar, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }} className="mini-bar-group">
                <div
                  style={{
                    width: '100%',
                    height: bar.height,
                    background: bar.isActive ? 'var(--color-primary)' : 'var(--color-surface-container)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'background 0.15s',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  className={bar.isActive ? '' : 'mini-bar'}
                  onMouseEnter={e => { if (!bar.isActive) e.currentTarget.style.background = 'var(--color-primary)'; }}
                  onMouseLeave={e => { if (!bar.isActive) e.currentTarget.style.background = 'var(--color-surface-container)'; }}
                >
                  {bar.value && (
                    <span style={{
                      position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)',
                      background: 'var(--color-inverse-surface)', color: 'var(--color-inverse-on-surface)',
                      fontSize: 10, padding: '3px 6px', borderRadius: 4, whiteSpace: 'nowrap',
                      opacity: 0, pointerEvents: 'none', transition: 'opacity 0.15s',
                    }} className="bar-tooltip">{bar.value}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* X-axis labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 var(--space-md)', marginTop: 4 }}>
            {WEEK_BARS.map((bar, i) => (
              <span key={i} style={{
                flex: 1, textAlign: 'center',
                fontSize: 9, fontWeight: bar.isActive ? 700 : 500,
                color: bar.isActive ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {bar.label}
              </span>
            ))}
          </div>
        </div>

        {/* AI Insights Summary */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
              <span className="material-symbols-outlined filled" style={{ color: 'var(--color-primary)', fontSize: 18 }}>auto_awesome</span>
              <span className="card-title">AI Insights Summary</span>
            </div>
            <button className="btn-ghost" style={{ fontSize: 12, padding: '2px 0' }} onClick={() => { }}>View All</button>
          </div>
          <div style={{ padding: 'var(--space-lg)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {AI_INSIGHTS.map((item, i) => (
              <div key={i} className={`insight-card ${item.cls}`}>
                <div className="insight-dot" style={{ background: item.dotColor }} />
                <div>
                  <div className="insight-priority" style={{ color: item.labelColor }}>{item.priority}</div>
                  <div className="insight-text">{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Surveys Table + Segment Donut */}
      <div className="bento-row col-4-8" style={{ marginBottom: 'var(--space-gutter)' }}>

        {/* Segment Share */}
        <div className="card card-p">
          <div className="card-title" style={{ marginBottom: 'var(--space-lg)' }}>Segment Share</div>
          {/* CSS Donut */}
          <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto var(--space-xl)' }}>
            <svg viewBox="0 0 160 160" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="80" cy="80" r="60" fill="none" stroke="var(--color-surface-high)" strokeWidth="16" />
              <circle cx="80" cy="80" r="60" fill="none" stroke="var(--color-primary-container)" strokeWidth="16"
                strokeDasharray={`${Math.PI * 2 * 60 * 0.45} ${Math.PI * 2 * 60}`} strokeLinecap="round" />
              <circle cx="80" cy="80" r="60" fill="none" stroke="var(--color-secondary)" strokeWidth="16"
                strokeDasharray={`${Math.PI * 2 * 60 * 0.25} ${Math.PI * 2 * 60}`}
                strokeDashoffset={`${-Math.PI * 2 * 60 * 0.45}`} strokeLinecap="round" />
              <circle cx="80" cy="80" r="60" fill="none" stroke="var(--color-tertiary-container)" strokeWidth="16"
                strokeDasharray={`${Math.PI * 2 * 60 * 0.15} ${Math.PI * 2 * 60}`}
                strokeDashoffset={`${-Math.PI * 2 * 60 * 0.70}`} strokeLinecap="round" />
              <circle cx="80" cy="80" r="60" fill="none" stroke="var(--color-surface-high)" strokeWidth="16"
                strokeDasharray={`${Math.PI * 2 * 60 * 0.15} ${Math.PI * 2 * 60}`}
                strokeDashoffset={`${-Math.PI * 2 * 60 * 0.85}`} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-on-surface)' }}>100%</span>
              <span style={{ fontSize: 10, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL CORE</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
            {[
              { color: 'var(--color-primary-container)', label: 'Technology 45%' },
              { color: 'var(--color-secondary)', label: 'Fintech 25%' },
              { color: 'var(--color-tertiary-container)', label: 'Healthcare 15%' },
              { color: 'var(--color-surface-high)', label: 'Retail 15%' },
            ].map((seg, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--color-on-surface-variant)' }}>{seg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Survey Activity */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-header">
            <span className="card-title">Recent Survey Activity</span>
            <button className="btn btn-secondary btn-sm" id="view-logs-btn">View Logs</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Survey Name</th>
                  <th>Sentiment</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_ACTIVITY.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <div className="user-chip">
                        <div className="user-initials" style={{ background: row.bg, color: row.color }}>{row.initials}</div>
                        <span>{row.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-on-surface)', fontWeight: 500 }}>{row.survey}</td>
                    <td><span className={`badge ${row.sentCls}`}>{row.sentiment}</span></td>
                    <td style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'inherit', fontSize: 12 }}>{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>



      {loading ? (
        <div className="loading-container" style={{ padding: 40 }}>
          <div className="spinner" />
          <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)' }}>Loading surveys...</p>
        </div>
      ) : surveys.length === 0 ? (
        <div className="card card-p" style={{ textAlign: 'center', padding: 48 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--color-outline-variant)', display: 'block', marginBottom: 16 }}>assignment</span>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: 8 }}>No Surveys Found</h3>
          <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', maxWidth: 400, margin: '0 auto 24px' }}>
            Get started by generating your first AI-powered survey. Upload a product specification and let the engine build targeted questions.
          </p>
          <button className="btn btn-primary" onClick={onCreateNew}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_awesome</span>
            Generate First Survey
          </button>
        </div>
      ) : (
        <div className="survey-card-grid">
          {surveys.map(s => {
            const isSelected = s.id === selectedSurveyId;
            return (
              <div
                key={s.id}
                className={`survey-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedSurveyId(s.id)}
                id={`survey-card-${s.id}`}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                    <h3 className="survey-card-title">{s.title}</h3>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ padding: '5px 6px', flexShrink: 0, marginLeft: 8 }}
                      onClick={e => { e.stopPropagation(); onDelete(s.id); }}
                      id={`delete-survey-${s.id}`}
                      title="Delete survey"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>delete</span>
                    </button>
                  </div>
                  <p className="survey-card-desc">{s.description || 'No description provided.'}</p>
                </div>

                <div className="survey-card-footer">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={e => { e.stopPropagation(); onFillSurvey(s.id); }}
                    id={`fill-survey-${s.id}`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>open_in_new</span>
                    Fill Survey
                  </button>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={e => { e.stopPropagation(); onOpenAnalytics(s.id); }}
                      id={`analytics-btn-${s.id}`}
                    >
                      Analytics
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={e => { e.stopPropagation(); onOpenInsights(s.id); }}
                      id={`insights-btn-${s.id}`}
                    >
                      AI Insights
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const data = await api.publishSurvey(s.id);
                          await navigator.clipboard.writeText(data.share_url);
                          window.open(data.share_url, "_blank");
                          alert(`Survey Published!\n\nLink copied to clipboard and opened.`);
                        } catch (err) {
                          alert(err.message);
                        }
                      }}
                    >
                      Share Link
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="page-footer">
        <span>
          Powered by{" "}
          <span
            style={{
              color: "var(--color-primary)",
              fontWeight: 700,
            }}
          >
            InsightEngine™
          </span>{" "}
          AI V4.2
        </span>

        <div className="footer-links">
          <span>System Status: Online</span>
          <span>Data Privacy Policy</span>
        </div>
      </div>
    </div>
  );
}
