import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchQuestions, fetchResults } from '../services/api'

const fallbackQuestions = [
  { id: 1, text: 'Do you enjoy outdoor activities?', category: 'Lifestyle' },
  { id: 2, text: 'Are you a morning person?', category: 'Lifestyle' },
  { id: 3, text: 'Do you like to travel?', category: 'Interests' },
  { id: 4, text: 'Are you interested in politics?', category: 'Interests' },
  { id: 5, text: 'Do you enjoy cooking?', category: 'Hobbies' }
];

function Results() {
  const [results, setResults] = useState([])
  const [questions, setQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const { sessionId } = useParams()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [questionsData, resultsData] = await Promise.all([
          fetchQuestions(),
          fetchResults(sessionId)
        ])

        setQuestions(questionsData)
        
        const formattedResults = Object.entries(resultsData).map(([questionId, answers]) => ({
          questionId: parseInt(questionId),
          answers
        }))
        setResults(formattedResults)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load results from server. Displaying local results if available.')
        // Try to load results from localStorage
        const localAnswers = localStorage.getItem(`answers_${sessionId}`)
        if (localAnswers) {
          const parsedAnswers = JSON.parse(localAnswers)
          const formattedResults = Object.entries(parsedAnswers).map(([questionId, answer]) => ({
            questionId: parseInt(questionId),
            answers: { [localStorage.getItem('userId')]: answer }
          }))
          setResults(formattedResults)
          setQuestions(fallbackQuestions)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [sessionId])

  if (isLoading) return <div>Loading results...</div>
  if (error) return (
    <div>
      <p style={{ color: 'orange' }}>{error}</p>
      {results.length > 0 && <p>Displaying locally saved results:</p>}
    </div>
  )
  if (results.length === 0) return <div>No results available for this session.</div>

  return (
    <div>
      <h2>Results</h2>
      {results.map(({ questionId, answers }) => {
        const question = questions.find(q => q.id === questionId) || { text: `Question ${questionId}` }
        return (
          <div key={questionId}>
            <h3>{question.text}</h3>
            {Object.entries(answers).map(([userId, answer]) => (
              <p key={userId}>{userId}: {answer}</p>
            ))}
          </div>
        )
      })}
      <Link to="/">Back to Home</Link>
    </div>
  )
}

export default Results