import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

function Questionnaire() {
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const { sessionId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/questions')
      .then(response => response.json())
      .then(data => setQuestions(data))
  }, [])

  const answerQuestion = (answer) => {
    const question = questions[currentQuestionIndex]
    fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userId: 'user1', questionId: question.id, answer })
    })
      .then(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1)
        } else {
          navigate(`/results/${sessionId}`)
        }
      })
  }

  if (questions.length === 0) return <div>Loading...</div>

  const question = questions[currentQuestionIndex]

  return (
    <div>
      <h2>{question.text}</h2>
      {[1, 2, 3, 4, 5].map(value => (
        <button key={value} onClick={() => answerQuestion(value)}>{value}</button>
      ))}
      <p>1 - Not a chance, 5 - All the time</p>
      <p>Question {currentQuestionIndex + 1} of {questions.length}</p>
    </div>
  )
}

export default Questionnaire