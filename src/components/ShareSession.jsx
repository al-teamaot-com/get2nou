import React from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCode from 'qrcode.react';

function ShareSession() {
  const { sessionId } = useParams();
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
        <Link to={`/results/${sessionId}`}>View Results</Link>
      </div>
    </div>
  );
}

export default ShareSession;