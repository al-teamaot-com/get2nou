import React, { useState, useEffect } from 'react';
import { fetchQuestions, fetchCategories, createQuestion, updateQuestion, deleteQuestion } from '../services/api';

function DatabaseManager() {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState({ text: '', categories: [] });
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedQuestions, fetchedCategories] = await Promise.all([
        fetchQuestions(),
        fetchCategories()
      ]);
      setQuestions(fetchedQuestions);
      setCategories(fetchedCategories);
      setError(null);
    } catch (err) {
      setError(`Failed to load data: ${err.message}`);
      console.error('Error details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    try {
      await createQuestion(newQuestion.text, newQuestion.categories);
      setNewQuestion({ text: '', categories: [] });
      loadData();
    } catch (err) {
      setError(`Failed to create question: ${err.message}`);
    }
  };

  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    try {
      await updateQuestion(editingQuestion.id, editingQuestion.text, editingQuestion.categories);
      setEditingQuestion(null);
      loadData();
    } catch (err) {
      setError(`Failed to update question: ${err.message}`);
    }
  };

  const handleDeleteQuestion = async (id) => {
    try {
      await deleteQuestion(id);
      loadData();
    } catch (err) {
      setError(`Failed to delete question: ${err.message}`);
    }
  };

  const handleCategoryChange = (e, questionState, setQuestionState) => {
    const selectedCategories = Array.from(e.target.selectedOptions, option => option.value);
    setQuestionState({ ...questionState, categories: selectedCategories });
  };

  if (loading) return <div className="loading">Loading data...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="database-manager">
      <h2>Database Manager</h2>
      
      <h3>Questions</h3>
      <form onSubmit={handleCreateQuestion}>
        <input
          type="text"
          value={newQuestion.text}
          onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
          placeholder="Question text"
          required
        />
        <select
          multiple
          value={newQuestion.categories}
          onChange={(e) => handleCategoryChange(e, newQuestion, setNewQuestion)}
          required
        >
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <button type="submit">Create Question</button>
      </form>

      {questions.map((question) => (
        <div key={question.id} className="question-item">
          {editingQuestion && editingQuestion.id === question.id ? (
            <form onSubmit={handleUpdateQuestion}>
              <input
                type="text"
                value={editingQuestion.text}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                required
              />
              <select
                multiple
                value={editingQuestion.categories}
                onChange={(e) => handleCategoryChange(e, editingQuestion, setEditingQuestion)}
                required
              >
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <button type="submit">Save</button>
              <button type="button" onClick={() => setEditingQuestion(null)}>Cancel</button>
            </form>
          ) : (
            <>
              <p>{question.text} (Categories: {question.categories.join(', ')})</p>
              <button onClick={() => setEditingQuestion(question)}>Edit</button>
              <button onClick={() => handleDeleteQuestion(question.id)}>Delete</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default DatabaseManager;