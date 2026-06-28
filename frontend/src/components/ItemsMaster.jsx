import { useState } from 'react';

function ItemsMaster({ categories, languages, items, onAddItem }) {
  const [itemForm, setItemForm] = useState({
    name: '',
    categoryId: categories[0]?.id || '',
    languageId: languages[0]?.id || '',
    openingQty: 0,
    isActive: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemForm.name.trim()) return;
    await onAddItem(itemForm);
    setItemForm({
      name: '',
      categoryId: categories[0]?.id || '',
      languageId: languages[0]?.id || '',
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

            <label className="field-label">Item Category</label>
            <select
              value={itemForm.categoryId}
              onChange={(e) => setItemForm({ ...itemForm, categoryId: Number(e.target.value) })}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <label className="field-label">Item Language</label>
            <select
              value={itemForm.languageId}
              onChange={(e) => setItemForm({ ...itemForm, languageId: Number(e.target.value) })}
            >
              {languages.map((language) => (
                <option key={language.id} value={language.id}>
                  {language.name}
                </option>
              ))}
            </select>

            <label className="field-label">Opening Quantity</label>
            <input
              type="number"
              min="0"
              placeholder="Opening quantity"
              value={itemForm.openingQty}
              onChange={(e) => setItemForm({ ...itemForm, openingQty: Number(e.target.value) })}
            />

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
                <p>Opening Qty: {item.openingQty}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </section>
  );
}

export default ItemsMaster;
