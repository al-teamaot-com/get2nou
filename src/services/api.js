const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://get2nou-bdc17edccd94.herokuapp.com/api'
  : '/api';

export const fetchQuestions = async () => {
  const response = await fetch(`${API_BASE_URL}/questions`);
  if (!response.ok) {
    throw new Error('Failed to fetch questions');
  }
  return response.json();
};

export const submitAnswer = async (sessionId, userId, questionId, answer) => {
  const response = await fetch(`${API_BASE_URL}/answers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId, userId, questionId, answer }),
  });
  if (!response.ok) {
    throw new Error('Failed to submit answer');
  }
  return response.json();
};

export const fetchResults = async (sessionId) => {
  const response = await fetch(`${API_BASE_URL}/results/${sessionId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch results');
  }
  return response.json();
};

export const createOrJoinSession = async (sessionId, userId) => {
  const response = await fetch(`${API_BASE_URL}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId, userId }),
  });
  if (!response.ok) {
    throw new Error('Failed to create or join session');
  }
  return response.json();
};