import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

function JoinSession() {
  const [sessionId, setSessionId] = useState('')
  const navigate = useNavigate()
  const params = useParams()

  useEffect(() => {
    if (params.sessionId) {
      setSessionId(params.sessionId)
    }
  }, [params.sessionId])

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