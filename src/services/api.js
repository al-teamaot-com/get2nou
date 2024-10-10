const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://get2nou-bdc17edccd94.herokuapp.com/api'
  : '/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Server response:', response.status, errorText);
    throw new Error(`${response.status}: ${errorText}`);
  }
  return response.json();
};

export const fetchQuestions = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/questions`);
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

export const submitAnswer = async (sessionId, userId, questionId, answer) => {
  try {
    const response = await fetch(`${API_BASE_URL}/answers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, userId, questionId, answer }),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
};

export const fetchResults = async (sessionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/results/${sessionId}`);
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching results:', error);
    throw error;
  }
};

export const createOrJoinSession = async (sessionId, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, userId }),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error creating or joining session:', error);
    throw error;
  }
};