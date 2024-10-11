import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchQuestions, fetchResults } from '../services/api';

function Results() {
  const [results, setResults] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { sessionId } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [questionsData, resultsData] = await Promise.all([
          fetchQuestions(),
          fetchResults(sessionId)
        ]);

        setQuestions(questionsData);
        
        const formattedResults = Object.entries(resultsData).map(([questionId, answers]) => ({
          questionId: parseInt(questionId),
          answers
        }));
        setResults(formattedResults);
      } catch (err) {
        setError('Failed to load results. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  if (isLoading) return <div className="loading">Loading results...</div>;
  if (error) return <div className="error">{error}</div>;
  if (results.length === 0) return <div className="error">No results available for this session.</div>;

  return (
    <div>
      <h2>Results</h2>
      {results.map(({ questionId, answers }) => {
        const question = questions.find(q => q.id === questionId) || { text: `Question ${questionId}` };
        return (
          <div key={questionId} className="result-item">
            <h3>{question.text}</h3>
            {Object.entries(answers).map(([userId, { answer, userHandle }]) => (
              <p key={userId}>{userHandle || userId}: {answer}</p>
            ))}
          </div>
        );
      })}
      <div className="navigation">
        <Link to="/">
          <button>Back to Home</button>
        </Link>
      </div>
    </div>
  );
}

export default Results;