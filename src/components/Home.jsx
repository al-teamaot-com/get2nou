import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const startNewSession = () => {
    const sessionId = Math.random().toString(36).substring(2, 10);
    navigate(`/questionnaire/${sessionId}`);
  };

  return (
    <div className="container">
      <h1>Welcome to Get to Know You</h1>
      <p>Start a new session or join an existing one to begin answering questions and learning about others!</p>
      <div className="button-group">
        <button onClick={startNewSession}>Start New Session</button>
        <button onClick={() => navigate('/join')}>Join Existing Session</button>
      </div>
      <div className="button-group">
        <button onClick={() => navigate('/database')}>Manage Questions</button>
        <button onClick={() => navigate('/categories')}>Manage Categories</button>
      </div>
    </div>
  );
}

export default Home;