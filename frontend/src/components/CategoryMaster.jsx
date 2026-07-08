import { useState } from 'react';

function CategoryMaster({ categories, onAddCategory, onUpdateCategory, onDeleteCategory }) {
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', isActive: true });
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!categoryForm.name || !categoryForm.name.trim()) nextErrors.name = 'Name is required';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    if (editingId) {
      await onUpdateCategory(editingId, categoryForm);
      setEditingId(null);
    } else {
      await onAddCategory(categoryForm);
    }
    setCategoryForm({ name: '', description: '', isActive: true });
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
          <h3>Add Category</h3>
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
            <button type="submit">Save Category</button>
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
                  <button onClick={() => onDeleteCategory(category.id)} className="danger" style={{ marginLeft: 8 }}>Delete</button>
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
