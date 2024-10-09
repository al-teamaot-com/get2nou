import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function JoinSession() {
  const [sessionId, setSessionId] = useState('')
  const navigate = useNavigate()

  const joinSession = () => {
    if (sessionId) {
      navigate(`/questionnaire/${sessionId}`)
    }
  }

  return (
    <div>
      <h2>Join Session</h2>
      <input
        type="text"
        value={sessionId}
        onChange={(e) => setSessionId(e.target.value)}
        placeholder="Enter Session ID"
      />
      <button onClick={joinSession}>Join</button>
    </div>
  )
}

export default JoinSession