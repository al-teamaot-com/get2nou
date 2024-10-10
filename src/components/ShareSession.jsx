import React from 'react';
import QRCode from 'qrcode.react';

function ShareSession({ sessionId, onSubmit }) {
  const shareUrl = `${window.location.origin}/questionnaire/${sessionId}`;

  return (
    <div className="share-session">
      <h2>Share Your Session</h2>
      <p>Share this link or QR code with others to join your session:</p>
      <div className="share-url">
        <input type="text" value={shareUrl} readOnly />
        <button onClick={() => navigator.clipboard.writeText(shareUrl)}>
          Copy Link
        </button>
      </div>
      <div className="qr-code">
        <QRCode value={shareUrl} size={256} />
      </div>
      <div className="navigation">
        <button onClick={onSubmit}>Submit and View Results</button>
      </div>
    </div>
  );
}

export default ShareSession;