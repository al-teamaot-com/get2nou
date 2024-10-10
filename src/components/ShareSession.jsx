import React from 'react';

function ShareSession({ sessionId, onSubmit }) {
  const shareUrl = `${window.location.origin}/questionnaire/${sessionId}`;

  return (
    <div className="share-session">
      <h2>Share Your Session</h2>
      <p>Share this link with others to join your session:</p>
      <div className="share-url">
        <input type="text" value={shareUrl} readOnly />
        <button onClick={() => navigator.clipboard.writeText(shareUrl)}>
          Copy Link
        </button>
      </div>
      <div className="navigation">
        <button onClick={onSubmit}>Submit and View Results</button>
      </div>
    </div>
  );
}

export default ShareSession;