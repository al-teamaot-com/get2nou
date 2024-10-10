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
        setError('Unable to connect to the server. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    initSession()
  }, [sessionId])

  // ... rest of the component code ...

  if (isLoading) return <div className="loading">Loading questions...</div>
  if (error) return <div className="error">{error}</div>
  if (questions.length === 0) return <div className="error">No questions available. Please try refreshing the page.</div>

  // ... rest of the component code ...
}

export default Questionnaire