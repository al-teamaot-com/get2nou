const API_BASE_URL = '/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error:', response.status, errorText);
    throw new Error(`${response.status}: ${errorText}`);
  }
  return response.json();
};

// ... rest of the file remains the same ...