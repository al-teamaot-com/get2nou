import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const startNewSession = () => {
    const sessionId = Math.random().toString(36).substring(2, 10);
    navigate(`/questionnaire/${sessionId}`);
  };

  console.log('Home component rendered');

  return (
    <div>
      <h2>Welcome to Get to Know You</h2>
      <p>Start a new session or join an existing one.</p>
      <button onClick={startNewSession}>Start New Session</button>
      <button onClick={() => navigate('/join')}>Join Existing Session</button>
      <div>
        <Link to="/database">Database Manager</Link>
      </div>
    </div>
  );
}

export default Home;