import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import App from './App.jsx';
import PublicSurvey from './components/PublicSurvey.jsx';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/s/:token" element={<PublicSurvey />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);