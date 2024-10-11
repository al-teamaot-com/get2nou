import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchQuestions, submitAnswer, createOrJoinSession } from '../services/api';
import ShareSession from './ShareSession';

function Questionnaire() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [userId, setUserId] = useState('');
  const [handle, setHandle] = useState('');
  const { sessionId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const initSession = async () => {
      try {
        const newUserId = Math.random().toString(36).substring(7);
        setUserId(newUserId);
        await createOrJoinSession(sessionId, newUserId);
        const fetchedQuestions = await fetchQuestions();
        setQuestions(fetchedQuestions);
      } catch (err) {
        setError(`Unable to connect to the server. Please check your internet connection and try again. (Error: ${err.message})`);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, [sessionId]);

  const handleSubmitHandle = () => {
    if (handle.trim()) {
      setCurrentQuestionIndex(0);
    }
  };

  const handleAnswer = async (answer) => {
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers({ ...answers, [currentQuestion.id]: answer });

    try {
      await submitAnswer(sessionId, userId, currentQuestion.id, answer, handle);
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setShowShareOptions(true);
      }
    } catch (err) {
      setError(`Failed to submit answer. Please check your internet connection and try again. (Error: ${err.message})`);
    }
  };

  const handleSubmit = () => {
    navigate(`/results/${sessionId}`);
  };

  if (isLoading) return <div className="loading">Loading questions...</div>;
  if (error) return <div className="error">{error}</div>;
  if (questions.length === 0) return <div className="error">No questions available. Please try refreshing the page.</div>;

  if (currentQuestionIndex === -1) {
    return (
      <div>
        <h2>Enter your handle</h2>
        <input
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="Enter your handle"
        />
        <button onClick={handleSubmitHandle} disabled={!handle.trim()}>Start</button>
      </div>
    );
  }

  if (showShareOptions) {
    return <ShareSession sessionId={sessionId} onSubmit={handleSubmit} />;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div>
      <h2>{handle}, {currentQuestion.text}</h2>
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
  );
}

export default Questionnaire;