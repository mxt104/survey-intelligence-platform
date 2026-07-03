/**
 * API Wrapper for Backend Integration
 */

export async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errText = await response.text();
    let message = "Network request failed";
    try {
      const parsed = JSON.parse(errText);
      message = parsed.detail || message;
    } catch {
      message = errText || message;
    }
    throw new Error(message);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export const api = {
  // Surveys
  getSurveys: () => request('/api/surveys'),

  getSurvey: (id) => request(`/api/surveys/${id}`),

  createSurvey: (surveyData) => request('/api/surveys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(surveyData),
  }),

  deleteSurvey: (id) => request(`/api/surveys/${id}`, {
    method: 'DELETE',
  }),

  // AI Survey Question Generation
  generateSurvey: (formData) => request('/api/generate-survey', {
    method: 'POST',
    body: formData, // Send as multipart/form-data directly
  }),

  // Response Submissions
  submitResponse: (id, answers) => request(`/api/surveys/${id}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  }),

  // Mock responses hydration for testing
  generateMockResponses: (id) => request(`/api/surveys/${id}/generate-mock-responses`, {
    method: 'POST',
  }),

  // Module 3: Response Analytics
  getAnalytics: (id) => request(`/api/surveys/${id}/analytics`),

  // Module 4: AI Insights
  getInsights: (id) => request(`/api/surveys/${id}/insights`),

  // Module 5: SEO Recommendation Engine
  getSEO: (id) => request(`/api/surveys/${id}/seo-recommendations`),

  // Publish survey and generate public share link
  publishSurvey: (id) => request(`/api/surveys/${id}/publish`, {
    method: 'POST',
  }),

  // Load public survey using token
  getPublicSurvey: (token) => request(`/api/public/survey/${token}`),

  // Submit public survey response
  submitPublicResponse: (token, answers) => request(
    `/api/public/survey/${token}/response`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    }
  ),
};