import React, { useState, useEffect } from 'react';
import { fetchQuestions, createQuestion, updateQuestion, deleteQuestion, fetchCategories } from '../services/api';

function DatabaseManager() {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState({ text: '', categories: [] });
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(() => {
    loadQuestions();
    loadCategories();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const fetchedQuestions = await fetchQuestions();
      setQuestions(fetchedQuestions);
      setError(null);
    } catch (err) {
      setError(`Failed to load questions: ${err.message}`);
      console.error('Error details:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const fetchedCategories = await fetchCategories();
      setCategories(fetchedCategories);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    try {
      await createQuestion(newQuestion.text, newQuestion.categories);
      setNewQuestion({ text: '', categories: [] });
      loadQuestions();
    } catch (err) {
      setError(`Failed to create question: ${err.message}`);
    }
  };

  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    try {
      await updateQuestion(editingQuestion.id, editingQuestion.text, editingQuestion.categories);
      setEditingQuestion(null);
      loadQuestions();
    } catch (err) {
      setError(`Failed to update question: ${err.message}`);
    }
  };

  const handleDeleteQuestion = async (id) => {
    try {
      await deleteQuestion(id);
      loadQuestions();
    } catch (err) {
      setError(`Failed to delete question: ${err.message}`);
    }
  };

  const handleCategoryChange = (e, questionSetter) => {
    const selectedCategories = Array.from(e.target.selectedOptions, option => option.value);
    questionSetter(prev => ({ ...prev, categories: selectedCategories }));
  };

  return (
    <div className="database-manager">
      <h2>Database Manager</h2>
      {loading && <p>Loading questions...</p>}
      {error && <p className="error">{error}</p>}
      
      <h3>Create New Question</h3>
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
          onChange={(e) => handleCategoryChange(e, setNewQuestion)}
        >
          {categories.map(category => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
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
                <select
                  multiple
                  value={editingQuestion.categories}
                  onChange={(e) => handleCategoryChange(e, setEditingQuestion)}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditingQuestion(null)}>Cancel</button>
              </form>
            ) : (
              <>
                <p>{question.text}</p>
                <p>Categories: {question.categories.map(cat => categories.find(c => c.id === cat)?.name).join(', ')}</p>
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