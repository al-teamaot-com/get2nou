import React, { useState, useEffect } from 'react';
import { fetchQuestions, createQuestion, updateQuestion, deleteQuestion } from '../services/api';

function DatabaseManager() {
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState({ text: '', category: '' });
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const fetchedQuestions = await fetchQuestions();
      setQuestions(fetchedQuestions);
      setError(null);
    } catch (err) {
      console.error('Error loading questions:', err);
      setError(`Failed to load questions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);
      await createQuestion(newQuestion.text, newQuestion.category);
      setNewQuestion({ text: '', category: '' });
      await loadQuestions();
    } catch (err) {
      console.error('Error creating question:', err);
      setError(`Failed to create question: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);
      await updateQuestion(editingQuestion.id, editingQuestion.text, editingQuestion.category);
      setEditingQuestion(null);
      await loadQuestions();
    } catch (err) {
      console.error('Error updating question:', err);
      setError(`Failed to update question: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    try {
      setError(null);
      setLoading(true);
      await deleteQuestion(id);
      await loadQuestions();
    } catch (err) {
      console.error('Error deleting question:', err);
      setError(`Failed to delete question: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading questions...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="database-manager">
      <h2>Database Manager</h2>
      
      <h3>Create New Question</h3>
      <form onSubmit={handleCreateQuestion}>
        <input
          type="text"
          value={newQuestion.text}
          onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
          placeholder="Question text"
          required
        />
        <input
          type="text"
          value={newQuestion.category}
          onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
          placeholder="Category"
          required
        />
        <button type="submit">Create Question</button>
      </form>

      <h3>Existing Questions</h3>
      {questions.length === 0 ? (
        <p>No questions found in the database.</p>
      ) : (
        questions.map((question) => (
          <div key={question.id} className="question-item">
            {editingQuestion && editingQuestion.id === question.id ? (
              <form onSubmit={handleUpdateQuestion}>
                <input
                  type="text"
                  value={editingQuestion.text}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                  required
                />
                <input
                  type="text"
                  value={editingQuestion.category}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, category: e.target.value })}
                  required
                />
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditingQuestion(null)}>Cancel</button>
              </form>
            ) : (
              <>
                <p>{question.text} (Category: {question.category})</p>
                <button onClick={() => setEditingQuestion(question)}>Edit</button>
                <button onClick={() => handleDeleteQuestion(question.id)}>Delete</button>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default DatabaseManager;