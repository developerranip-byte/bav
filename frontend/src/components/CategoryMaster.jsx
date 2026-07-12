import { useEffect, useState } from 'react';
import { API_BASE, createAuthHeaders } from '../utils/api';

function CategoryMaster({ authHeaders, setToast }) {
  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', isActive: true });
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  const token = localStorage.getItem('bav_auth_token');
  const headers = () => createAuthHeaders(token);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`, { headers: headers() });
      if (res.ok) {
        setCategories(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!categoryForm.name || !categoryForm.name.trim()) nextErrors.name = 'Name is required';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_BASE}/categories/${editingId}` : `${API_BASE}/categories`;
      const res = await fetch(url, {
        method,
        headers: headers(),
        body: JSON.stringify(categoryForm),
      });

      if (res.ok) {
        setToast({ type: 'success', message: editingId ? 'Category updated' : 'Category saved' });
        setCategoryForm({ name: '', description: '', isActive: true });
        setEditingId(null);
        fetchCategories();
      } else {
        const error = await res.json();
        setToast({ type: 'error', message: error.message || res.statusText });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      const res = await fetch(`${API_BASE}/categories/${id}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (res.ok || res.status === 204) {
        setToast({ type: 'success', message: 'Category deleted' });
        fetchCategories();
      } else {
        const error = await res.json();
        setToast({ type: 'error', message: error.message || res.statusText });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error' });
    }
  };

  return (
    <section className="page-card">
      <div className="page-header">
        <div>
          <h2>Category Master</h2>
          <span className="page-badge">category_master</span>
        </div>
        <p>Maintain category information from one place.</p>
      </div>

      <section className="content-grid">
        <div className="card">
          <h3>{editingId ? 'Edit' : 'Add'} Category</h3>
          <form onSubmit={handleCategorySubmit}>
                  <label className="field-label">Category Name</label>
            <input
              placeholder="Enter category name"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            />
            {errors.name && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{errors.name}</div>}
            <label className="field-label">Is Active</label>
            <select
              value={categoryForm.isActive ? 'true' : 'false'}
              onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.value === 'true' })}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
            <label className="field-label">Description</label>
            <textarea
              placeholder="Optional description"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ flex: 1 }}>{editingId ? 'Update' : 'Save'} Category</button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setCategoryForm({ name: '', description: '', isActive: true }); setErrors({}); }} style={{ background: '#64748b', flex: 1 }}>Cancel</button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <h3>Available Categories</h3>
          <ul className="list">
            {categories.map((category) => (
              <li key={category.id}>
                <div className="list-row">
                  <strong>{category.name}</strong>
                  <span className={category.isActive ? 'status-pill active' : 'status-pill'}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p>{category.description}</p>
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => {
                    setEditingId(category.id);
                    setCategoryForm({ name: category.name, description: category.description || '', isActive: !!category.isActive });
                  }}>Edit</button>
                  <button onClick={() => handleDelete(category.id)} className="danger" style={{ marginLeft: 8 }}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </section>
  );
}

export default CategoryMaster;
