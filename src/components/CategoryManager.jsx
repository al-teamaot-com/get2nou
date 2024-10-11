import React, { useState, useEffect } from 'react';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../services/api';

function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const fetchedCategories = await fetchCategories();
      setCategories(fetchedCategories);
      setError(null);
    } catch (err) {
      setError(`Failed to load categories: ${err.message}`);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await createCategory(newCategoryName);
      setNewCategoryName('');
      loadCategories();
    } catch (err) {
      setError(`Failed to create category: ${err.message}`);
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    try {
      await updateCategory(editingCategory.id, editingCategory.name);
      setEditingCategory(null);
      loadCategories();
    } catch (err) {
      setError(`Failed to update category: ${err.message}`);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteCategory(id);
      loadCategories();
    } catch (err) {
      setError(`Failed to delete category: ${err.message}`);
    }
  };

  return (
    <div className="category-manager">
      <h2>Category Manager</h2>
      {error && <p className="error">{error}</p>}
      
      <h3>Create New Category</h3>
      <form onSubmit={handleCreateCategory}>
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Category name"
          required
        />
        <button type="submit">Create Category</button>
      </form>

      <h3>Existing Categories</h3>
      {categories.length === 0 ? (
        <p>No categories found.</p>
      ) : (
        categories.map((category) => (
          <div key={category.id} className="category-item">
            {editingCategory && editingCategory.id === category.id ? (
              <form onSubmit={handleUpdateCategory}>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  required
                />
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditingCategory(null)}>Cancel</button>
              </form>
            ) : (
              <>
                <span>{category.name}</span>
                <button onClick={() => setEditingCategory(category)}>Edit</button>
                <button onClick={() => handleDeleteCategory(category.id)}>Delete</button>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default CategoryManager;