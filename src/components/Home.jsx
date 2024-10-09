import React from 'react'
import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()

  const startNewSession = () => {
    const sessionId = Math.random().toString(36).substring(2, 10)
    navigate(`/questionnaire/${sessionId}`)
  }

  return (
    <div>
      <h1>Get to Know You</h1>
      <button onClick={startNewSession}>Start New Session</button>
      <button onClick={() => navigate('/join')}>Join Existing Session</button>
    </div>
  )
}

export default Home