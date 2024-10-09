import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

function Results() {
  const [results, setResults] = useState([])
  const [questions, setQuestions] = useState([])
  const { sessionId } = useParams()

  useEffect(() => {
    fetch('/api/questions')
      .then(response => response.json())
      .then(data => setQuestions(data))

    fetch(`/api/results/${sessionId}`)
      .then(response => response.json())
      .then(data => {
        const formattedResults = Object.entries(data).map(([questionId, answers]) => ({
          questionId: parseInt(questionId),
          answers
        }))
        setResults(formattedResults)
      })
  }, [sessionId])

  return (
    <div>
      <h2>Results</h2>
      {results.map(({ questionId, answers }) => {
        const question = questions.find(q => q.id === questionId)
        return (
          <div key={questionId}>
            <h3>{question ? question.text : 'Unknown question'}</h3>
            {Object.entries(answers).map(([userId, answer]) => (
              <p key={userId}>{userId}: {answer}</p>
            ))}
          </div>
        )
      })}
    </div>
  )
}

export default Results