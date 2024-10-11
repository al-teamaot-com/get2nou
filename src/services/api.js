const API_BASE_URL = '/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error:', response.status, errorText);
    throw new Error(`${response.status}: ${errorText}`);
  }
  return response.json();
};

export const fetchQuestions = async () => {
  console.log('Fetching questions');
  const response = await fetch(`${API_BASE_URL}/questions`);
  return handleResponse(response);
};

export const submitAnswer = async (sessionId, userId, questionId, answer) => {
  console.log(`Submitting answer: Session ${sessionId}, User ${userId}, Question ${questionId}, Answer ${answer}`);
  const response = await fetch(`${API_BASE_URL}/answers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId, userId, questionId, answer }),
  });
  return handleResponse(response);
};

export const fetchResults = async (sessionId) => {
  console.log(`Fetching results for session: ${sessionId}`);
  const response = await fetch(`${API_BASE_URL}/results/${sessionId}`);
  return handleResponse(response);
};

export const createOrJoinSession = async (sessionId, userId) => {
  console.log(`Creating/joining session: ${sessionId} for user: ${userId}`);
  const response = await fetch(`${API_BASE_URL}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId, userId }),
  });
  return handleResponse(response);
};