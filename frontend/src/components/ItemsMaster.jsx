import { useState } from 'react';

function ItemsMaster({ categories, languages, items, onAddItem, onUpdateItem, onDeleteItem }) {
  const [itemForm, setItemForm] = useState({
    name: '',
    categoryId: categories[0]?.id || '',
    languageId: languages[0]?.id || '',
    isbn: '',
    openingQty: 0,
    isActive: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!itemForm.name || !itemForm.name.trim()) nextErrors.name = 'Item name is required';
    if (!itemForm.categoryId) nextErrors.categoryId = 'Select a category';
    if (!itemForm.languageId) nextErrors.languageId = 'Select a language';
    if (itemForm.isbn && !itemForm.isbn.trim()) nextErrors.isbn = 'ISBN cannot be blank';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    if (editingId) {
      await onUpdateItem(editingId, itemForm);
      setEditingId(null);
    } else {
      await onAddItem(itemForm);
    }
    setItemForm({
      name: '',
      categoryId: categories[0]?.id || '',
      languageId: languages[0]?.id || '',
      isbn: '',
      openingQty: 0,
      isActive: true,
    });
  };

  const findCategoryName = (categoryId) => categories.find((cat) => cat.id === Number(categoryId))?.name || '-';
  const findLanguageName = (languageId) => languages.find((lang) => lang.id === Number(languageId))?.name || '-';

  return (
    <section className="page-card">
      <div className="page-header">
        <div>
          <h2>Items Master</h2>
          <span className="page-badge">items_master</span>
        </div>
        <p>Maintain item master details including category, language, quantity, and status.</p>
      </div>

      <section className="content-grid">
        <div className="card">
          <h3>Add Item</h3>
          <form onSubmit={handleSubmit}>
            <label className="field-label">Item Name</label>
            <input
              placeholder="Enter item name"
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
            />
            {errors.name && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{errors.name}</div>}

            <label className="field-label">ISBN</label>
            <input
              placeholder="Enter ISBN"
              value={itemForm.isbn}
              onChange={(e) => setItemForm({ ...itemForm, isbn: e.target.value })}
            />
            {errors.isbn && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{errors.isbn}</div>}

            <label className="field-label">Item Category</label>
            <select
              value={itemForm.categoryId}
              onChange={(e) => setItemForm({ ...itemForm, categoryId: Number(e.target.value) })}
            >
              {categories.filter((category) => category.isActive || category.id === itemForm.categoryId).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{errors.categoryId}</div>}

            <label className="field-label">Item Language</label>
            <select
              value={itemForm.languageId}
              onChange={(e) => setItemForm({ ...itemForm, languageId: Number(e.target.value) })}
            >
              {languages.filter((language) => language.isActive || language.id === itemForm.languageId).map((language) => (
                <option key={language.id} value={language.id}>
                  {language.name}
                </option>
              ))}
            </select>
            {errors.languageId && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{errors.languageId}</div>}

            <label className="field-label">Is Active</label>
            <select
              value={itemForm.isActive ? 'true' : 'false'}
              onChange={(e) => setItemForm({ ...itemForm, isActive: e.target.value === 'true' })}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>

            <button type="submit">Save Item</button>
          </form>
        </div>

        <div className="card">
          <h3>Item List</h3>
          <ul className="list">
            {items.map((item) => (
              <li key={item.id}>
                <div className="list-row">
                  <strong>{item.name}</strong>
                  <span className={item.isActive ? 'status-pill active' : 'status-pill'}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p>Category: {findCategoryName(item.categoryId)}</p>
                <p>Language: {findLanguageName(item.languageId)}</p>
                <p>ISBN: {item.isbn || '-'}</p>
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => {
                    setEditingId(item.id);
                    setItemForm({
                      name: item.name,
                      categoryId: item.categoryId || categories[0]?.id || '',
                      languageId: item.languageId || languages[0]?.id || '',
                      isbn: item.isbn || '',
                      openingQty: item.openingQty || 0,
                      isActive: !!item.isActive,
                    });
                  }}>Edit</button>
                  <button onClick={() => onDeleteItem(item.id)} className="danger" style={{ marginLeft: 8 }}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </section>
  );
}

export default ItemsMaster;
