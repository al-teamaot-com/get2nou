import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchQuestions, submitAnswer, createOrJoinSession } from '../services/api'
import ShareSession from './ShareSession'

function Questionnaire() {
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showShareOptions, setShowShareOptions] = useState(false)
  const [isFirstUser, setIsFirstUser] = useState(false)
  const { sessionId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const initSession = async () => {
      try {
        console.log('Initializing session...');
        const userId = Math.random().toString(36).substring(7)
        console.log('Generated userId:', userId);
        const sessionData = await createOrJoinSession(sessionId, userId)
        console.log('Session data:', sessionData);
        setIsFirstUser(sessionData.users.length === 1)
        console.log('Fetching questions...');
        const fetchedQuestions = await fetchQuestions()
        console.log('Fetched questions:', fetchedQuestions);
        setQuestions(fetchedQuestions)
      } catch (err) {
        console.error('Error initializing session:', err)
        setError(`Unable to connect to the server. Please check your internet connection and try again. (Error: ${err.message})`)
      } finally {
        setIsLoading(false)
      }
    }

    initSession()
  }, [sessionId])

  const handleAnswer = async (answer) => {
    const currentQuestion = questions[currentQuestionIndex]
    setAnswers({ ...answers, [currentQuestion.id]: answer })

    try {
      await submitAnswer(sessionId, 'user1', currentQuestion.id, answer)
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        setShowShareOptions(true)
      }
    } catch (err) {
      console.error('Error submitting answer:', err)
      setError(`Failed to submit answer. Please check your internet connection and try again. (Error: ${err.message})`)
    }
  }

  const handleSubmit = () => {
    navigate(`/results/${sessionId}`)
  }

  if (isLoading) return <div className="loading">Loading questions...</div>
  if (error) return <div className="error">{error}</div>
  if (questions.length === 0) return <div className="error">No questions available. Please try refreshing the page.</div>

  if (showShareOptions) {
    return <ShareSession sessionId={sessionId} onSubmit={handleSubmit} />
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div>
      <h2>{currentQuestion.text}</h2>
      <div className="answer-buttons">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => handleAnswer(value)}
            className={answers[currentQuestion.id] === value ? 'selected' : ''}
          >
            {value}
          </button>
        ))}
      </div>
      <p>1 - Not at all, 5 - Very much</p>
      <p>
        Question {currentQuestionIndex + 1} of {questions.length}
      </p>
    </div>
  )
}

export default Questionnaire