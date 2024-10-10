const API_BASE_URL = '/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Network response was not ok');
  }
  return response.json();
};

const handleError = (error) => {
  console.error('API Error:', error);
  throw new Error('Unable to connect to the server. Please try again later.');
};

export const createOrJoinSession = async (sessionId, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userId }),
    });
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

export const fetchQuestions = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/questions`);
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

export const submitAnswer = async (sessionId, userId, questionId, answer) => {
  try {
    const response = await fetch(`${API_BASE_URL}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userId, questionId, answer }),
    });
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

export const fetchResults = async (sessionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/results/${sessionId}`);
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};