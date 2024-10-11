const API_BASE_URL = '/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }
  return response.json();
};

export const fetchQuestions = async () => {
  const response = await fetch(`${API_BASE_URL}/questions`);
  return handleResponse(response);
};

export const fetchCategories = async () => {
  const response = await fetch(`${API_BASE_URL}/categories`);
  return handleResponse(response);
};

export const submitAnswer = async (sessionId, userId, questionId, answer) => {
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
  const response = await fetch(`${API_BASE_URL}/results/${sessionId}`);
  return handleResponse(response);
};

export const createOrJoinSession = async (sessionId, userId) => {
  const response = await fetch(`${API_BASE_URL}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId, userId }),
  });
  return handleResponse(response);
};

export const createQuestion = async (text, category) => {
  const response = await fetch(`${API_BASE_URL}/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, category }),
  });
  return handleResponse(response);
};

export const updateQuestion = async (id, text, category) => {
  const response = await fetch(`${API_BASE_URL}/questions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, category }),
  });
  return handleResponse(response);
};

export const deleteQuestion = async (id) => {
  const response = await fetch(`${API_BASE_URL}/questions/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};

// These functions are not implemented on the server side yet
export const createCategory = async (name) => {
  // Placeholder implementation
  console.log('Creating category:', name);
  return { id: Date.now(), name };
};

export const updateCategory = async (id, name) => {
  // Placeholder implementation
  console.log('Updating category:', id, name);
  return { id, name };
};

export const deleteCategory = async (id) => {
  // Placeholder implementation
  console.log('Deleting category:', id);
  return { success: true };
};