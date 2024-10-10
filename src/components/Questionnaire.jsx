import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchQuestions, submitAnswer, createOrJoinSession } from '../services/api'
import ShareSession from './ShareSession'

const fallbackQuestions = [
  { id: 1, text: 'Do you enjoy outdoor activities?', category: 'Lifestyle' },
  { id: 2, text: 'Are you a morning person?', category: 'Lifestyle' },
  { id: 3, text: 'Do you like to travel?', category: 'Interests' },
  { id: 4, text: 'Are you interested in politics?', category: 'Interests' },
  { id: 5, text: 'Do you enjoy cooking?', category: 'Hobbies' }
];

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
        const userId = localStorage.getItem('userId') || Math.random().toString(36).substring(7)
        localStorage.setItem('userId', userId)
        const sessionData = await createOrJoinSession(sessionId, userId)
        setIsFirstUser(sessionData.users.length === 1)
        const fetchedQuestions = await fetchQuestions()
        setQuestions(fetchedQuestions)
        const savedAnswers = JSON.parse(localStorage.getItem(`answers_${sessionId}`) || '{}')
        setAnswers(savedAnswers)
      } catch (err) {
        console.error('Error initializing session:', err)
        setError('Unable to connect to the server. Using default questions. Your answers will be saved locally.')
        setQuestions(fallbackQuestions)
      } finally {
        setIsLoading(false)
      }
    }

    initSession()
  }, [sessionId])

  const handleAnswer = (answer) => {
    const updatedAnswers = { ...answers, [questions[currentQuestionIndex].id]: answer }
    setAnswers(updatedAnswers)
    localStorage.setItem(`answers_${sessionId}`, JSON.stringify(updatedAnswers))
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleFinish = async () => {
    try {
      for (const [questionId, answer] of Object.entries(answers)) {
        await submitAnswer(sessionId, localStorage.getItem('userId'), parseInt(questionId), answer)
      }
      if (isFirstUser) {
        setShowShareOptions(true)
      } else {
        navigate(`/results/${sessionId}`)
      }
    } catch (err) {
      console.error('Error submitting answers:', err)
      setError('Failed to submit answers. Please try again.')
    }
  }

  if (isLoading) return <div className="loading">Loading questions...</div>
  if (error) return <div className="error">{error}</div>
  if (questions.length === 0) return <div className="error">No questions available.</div>

  if (showShareOptions) {
    return <ShareSession sessionId={sessionId} onSubmit={() => navigate(`/results/${sessionId}`)} />
  }

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const currentAnswer = answers[currentQuestion.id]

  return (
    <div>
      <h2>{currentQuestion.text}</h2>
      <div className="answer-buttons">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => handleAnswer(value)}
            style={{
              backgroundColor: currentAnswer === value ? '#2ecc71' : '',
              color: currentAnswer === value ? 'white' : '',
            }}
          >
            {value}
          </button>
        ))}
      </div>
      <p>1 - Not at all, 2 - Rarely, 3 - Sometimes, 4 - Often, 5 - Always</p>
      <p>Question {currentQuestionIndex + 1} of {questions.length}</p>
      <div className="navigation">
        <button onClick={handlePrevious} disabled={currentQuestionIndex === 0}>Previous</button>
        {!isLastQuestion && <button onClick={handleNext} disabled={!currentAnswer}>Next</button>}
        {isLastQuestion && <button onClick={handleFinish} disabled={Object.keys(answers).length !== questions.length}>Submit</button>}
      </div>
    </div>
  )
}

export default Questionnaire