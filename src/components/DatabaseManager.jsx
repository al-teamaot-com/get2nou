import React, { useState, useEffect } from 'react';
import Select from 'react-select';
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
      setCategories(fetchedCategories.map(cat => ({ value: cat.id, label: cat.name })));
    } catch (err) {
      setError(`Failed to load categories: ${err.message}`);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    try {
      await createQuestion(newQuestion.text, newQuestion.categories.map(cat => cat.value));
      setNewQuestion({ text: '', categories: [] });
      loadQuestions();
    } catch (err) {
      setError(`Failed to create question: ${err.message}`);
    }
  };

  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    try {
      await updateQuestion(editingQuestion.id, editingQuestion.text, editingQuestion.categories.map(cat => cat.value));
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
        <Select
          isMulti
          options={categories}
          value={newQuestion.categories}
          onChange={(selectedCategories) => setNewQuestion({ ...newQuestion, categories: selectedCategories })}
          placeholder="Select categories"
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
                <Select
                  isMulti
                  options={categories}
                  value={editingQuestion.categories}
                  onChange={(selectedCategories) => setEditingQuestion({ ...editingQuestion, categories: selectedCategories })}
                  placeholder="Select categories"
                />
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditingQuestion(null)}>Cancel</button>
              </form>
            ) : (
              <>
                <p>{question.text}</p>
                <p>Categories: {question.categories.map(cat => cat.name).join(', ')}</p>
                <button onClick={() => setEditingQuestion({...question, categories: question.categories.map(cat => ({ value: cat.id, label: cat.name }))})}>Edit</button>
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