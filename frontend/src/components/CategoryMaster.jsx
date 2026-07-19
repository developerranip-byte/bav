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
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.description || '-'}</td>
                  <td>
                    <span className={category.isActive ? 'status-pill active' : 'status-pill'}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="icon-btn" title="Edit" onClick={() => {
                      setEditingId(category.id);
                      setCategoryForm({ name: category.name, description: category.description || '', isActive: !!category.isActive });
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button className="icon-btn danger" title="Delete" onClick={() => handleDelete(category.id)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

export default CategoryMaster;
