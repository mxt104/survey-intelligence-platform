import React, { useState, useEffect } from 'react';
import { api } from './utils/api';

import SurveyGenerator from './components/SurveyGenerator';
import SurveyBuilder from './components/SurveyBuilder';
import SurveyTake from './components/SurveyTake';
import Analytics from './components/Analytics';
import AIInsights from './components/AIInsights';
import SEOEngine from './components/SEOEngine';
import Dashboard from './components/Dashboard';
import PublicSurvey from './components/PublicSurvey';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'create', label: 'AI Generator', icon: 'auto_awesome' },
  { key: 'builder', label: 'Survey Builder', icon: 'quiz' },
  { key: 'analytics', label: 'Analytics', icon: 'monitoring' },
  { key: 'seo', label: 'SEO Center', icon: 'search_insights' },
  { key: 'insights', label: 'AI Insights', icon: 'psychology' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [surveys, setSurveys] = useState([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);

  // Survey creation workflow
  const [creationStep, setCreationStep] = useState(1);
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [isSurveyTakingMode, setIsSurveyTakingMode] = useState(false);

  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const currentPath = window.location.pathname;

  const isPublicSurvey =
    currentPath.startsWith('/s/');

  const surveyToken =
    isPublicSurvey
      ? currentPath.split('/s/')[1]
      : null;

  const loadSurveys = async () => {
    try {
      const list = await api.getSurveys();
      setSurveys(list);
      if (list.length > 0 && !selectedSurveyId) {
        setSelectedSurveyId(list[0].id);
      }
    } catch (err) {
      // handled in dashboard
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSurveys(); }, []);
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [darkMode]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleSurveyGenerated = (data) => {
    setGeneratedQuestions(data);
    setCreationStep(2);
    setActiveTab('builder');
  };

  const handleSurveyPublished = async (surveyId) => {
    showToast('Survey published successfully!');
    setCreationStep(1);
    setGeneratedQuestions(null);
    setSelectedSurveyId(surveyId);
    await loadSurveys();
    setActiveTab('dashboard');
  };

  const handleDeleteSurvey = async (id) => {
    if (!window.confirm('Delete this survey and all its responses?')) return;
    try {
      await api.deleteSurvey(id);
      showToast('Survey deleted.');
      if (selectedSurveyId === id) setSelectedSurveyId(null);
      await loadSurveys();
    } catch (err) {
      showToast('Failed to delete survey.');
    }
  };

  const navigateTo = (tab) => {
    setActiveTab(tab);
    if (tab === 'create') setCreationStep(1);
  };

  const getPageTitle = () => {
    const map = {
      dashboard: 'Executive Dashboard',
      create: 'AI Survey Generator',
      builder: 'Survey Builder',
      analytics: 'Analytics Dashboard',
      seo: 'SEO Intelligence Center',
      insights: 'AI Insight Engine',
      content: 'Content Studio',
    };
    return map[activeTab] || 'Industrial Intel';
  };

  const getSelectedTitle = () => {
    const s = surveys.find(s => s.id === selectedSurveyId);
    return s ? s.title : '';
  };
  if (isPublicSurvey) {
    return (
      <PublicSurvey token={surveyToken} />
    );
  }
  // Survey taking overlay
  if (isSurveyTakingMode && selectedSurveyId) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
        <header style={{
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-outline-variant)',
          padding: '0 var(--space-margin-desktop)',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-md)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>quiz</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)' }}>Survey Form</span>
          <button className="btn btn-secondary btn-sm" onClick={() => { setIsSurveyTakingMode(false); loadSurveys(); }} style={{ marginLeft: 'auto' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
            Exit Form
          </button>
        </header>
        <div style={{ padding: 'var(--space-xl) var(--space-margin-desktop)' }}>
          <SurveyTake
            surveyId={selectedSurveyId}
            onBackToList={() => { setIsSurveyTakingMode(false); loadSurveys(); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">

      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <span className="material-symbols-outlined filled" style={{ fontSize: 18 }}>insights</span>
          </div>
          <div className="sidebar-brand-text">
            <h1>Industrial Intel</h1>
            <p>Marketing B2B</p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => navigateTo(item.key)}
              id={`nav-${item.key}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ===== TOP BAR ===== */}
      <header className="topbar">
        <div className="topbar-left">
          <span className="topbar-title">{getPageTitle()}</span>
          <div className="search-box">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search insights..."
              id="global-search"
            />
          </div>
        </div>

        <div className="topbar-right">
          <button className="icon-btn" id="notifications-btn" title="Notifications">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button
            className="icon-btn"
            id="theme-btn"
            title="Theme"
            onClick={() => setDarkMode(!darkMode)}
          >
            <span className="material-symbols-outlined">
              {darkMode ? 'dark_mode' : 'light_mode'}
            </span>
          </button>
          <div className="topbar-divider" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-on-surface)', lineHeight: 1.2 }}>Alex Rivera</span>
              <span style={{ fontSize: 10, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Executive Admin</span>
            </div>
            <div className="user-avatar-initials">AR</div>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="main-content">
        <div className="page-canvas">

          {/* TOAST */}
          {toastMessage && (
            <div className="toast">
              <span className="material-symbols-outlined filled" style={{ fontSize: 16, color: 'var(--color-secondary-fixed)' }}>check_circle</span>
              {toastMessage}
            </div>
          )}

          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <Dashboard
              surveys={surveys}
              selectedSurveyId={selectedSurveyId}
              setSelectedSurveyId={setSelectedSurveyId}
              loading={loading}
              onDelete={handleDeleteSurvey}
              onFillSurvey={(id) => { setSelectedSurveyId(id); setIsSurveyTakingMode(true); }}
              onOpenAnalytics={(id) => { setSelectedSurveyId(id); setActiveTab('analytics'); }}
              onCreateNew={() => navigateTo('create')}
              onOpenInsights={(id) => { setSelectedSurveyId(id); setActiveTab('insights'); }}
            />
          )}

          {/* TAB: AI GENERATOR */}
          {activeTab === 'create' && creationStep === 1 && (
            <div className="fade-in">
              <SurveyGenerator onGenerationSuccess={handleSurveyGenerated} />
            </div>
          )}

          {/* TAB: SURVEY BUILDER */}
          {(activeTab === 'builder' || (activeTab === 'create' && creationStep === 2)) && (
            <div className="fade-in">
              {generatedQuestions ? (
                <SurveyBuilder
                  initialData={generatedQuestions}
                  surveys={surveys}
                  selectedSurveyId={selectedSurveyId}
                  setSelectedSurveyId={setSelectedSurveyId}
                  onPublishSuccess={handleSurveyPublished}
                  onCancel={() => {
                    setCreationStep(1);
                    setGeneratedQuestions(null);
                    setActiveTab('dashboard');
                  }}
                />
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--color-outline-variant)' }}>quiz</span>
                  </div>
                  <h3>No Active Draft</h3>
                  <p>You need to generate a survey first before you can build it.</p>
                  <button className="btn btn-primary" onClick={() => navigateTo('create')}>Go to AI Generator</button>
                </div>
              )}
            </div>
          )}

          {/* TAB: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="fade-in">
              {selectedSurveyId ? (
                <Analytics surveyId={selectedSurveyId} />
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--color-outline-variant)' }}>monitoring</span>
                  </div>
                  <h3>Select a Survey First</h3>
                  <p>Go to the Dashboard and select a survey to view its analytics.</p>
                  <button className="btn btn-primary" onClick={() => navigateTo('dashboard')}>Go to Dashboard</button>
                </div>
              )}
            </div>
          )}

          {/* TAB: AI INSIGHTS */}
          {activeTab === 'insights' && (
            <div className="fade-in">
              {selectedSurveyId ? (
                <AIInsights surveyId={selectedSurveyId} surveyTitle={getSelectedTitle()} />
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--color-outline-variant)' }}>psychology</span>
                  </div>
                  <h3>Select a Survey First</h3>
                  <p>Go to the Dashboard and select a survey to run the AI Insight Engine.</p>
                  <button className="btn btn-primary" onClick={() => navigateTo('dashboard')}>Go to Dashboard</button>
                </div>
              )}
            </div>
          )}

          {/* TAB: SEO CENTER */}
          {activeTab === 'seo' && (
            <div className="fade-in">
              {selectedSurveyId ? (
                <SEOEngine surveyId={selectedSurveyId} />
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--color-outline-variant)' }}>search_insights</span>
                  </div>
                  <h3>Select a Survey First</h3>
                  <p>The SEO Intelligence Center requires a survey with text responses. Select one from the Dashboard.</p>
                  <button className="btn btn-primary" onClick={() => navigateTo('dashboard')}>Go to Dashboard</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
