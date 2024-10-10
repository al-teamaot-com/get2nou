const API_BASE_URL = '/api';

export const createOrJoinSession = async (sessionId, userId) => {
  const response = await fetch(`${API_BASE_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, userId }),
  });
  return response.json();
};

export const fetchQuestions = async () => {
  const response = await fetch(`${API_BASE_URL}/questions`);
  return response.json();
};

export const submitAnswer = async (sessionId, userId, questionId, answer) => {
  const response = await fetch(`${API_BASE_URL}/answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, userId, questionId, answer }),
  });
  return response.json();
};

export const fetchResults = async (sessionId) => {
  const response = await fetch(`${API_BASE_URL}/results/${sessionId}`);
  return response.json();
};