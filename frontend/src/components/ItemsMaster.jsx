import { useEffect, useState } from 'react';
import { API_BASE, createAuthHeaders } from '../utils/api';

function ItemsMaster({ setToast }) {
  const [itemsData, setItemsData] = useState({ data: [], page: 1, totalPages: 1 });
  const [categories, setCategories] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [itemForm, setItemForm] = useState({
    name: '',
    categoryId: '',
    languageId: '',
    isbn: '',
    isActive: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ search: '', categoryId: '', languageId: '' });
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [errors, setErrors] = useState({});

  const token = localStorage.getItem('bav_auth_token');
  const headers = () => createAuthHeaders(token);

  const fetchData = async () => {
    try {
      const [itemRes, catRes, langRes] = await Promise.all([
        fetch(`${API_BASE}/items`, { headers: headers() }),
        fetch(`${API_BASE}/categories`, { headers: headers() }),
        fetch(`${API_BASE}/languages`, { headers: headers() }),
      ]);

      if (itemRes.ok) setItemsData(await itemRes.json());
      if (catRes.ok) {
        const cats = await catRes.json();
        setCategories(cats);
        setItemForm((prev) => ({ ...prev, categoryId: cats[0]?.id || '' }));
      }
      if (langRes.ok) {
        const langs = await langRes.json();
        setLanguages(langs);
        setItemForm((prev) => ({ ...prev, languageId: langs[0]?.id || '' }));
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchItems = async (page = 1) => {
    try {
      const queryParams = new URLSearchParams({ page });
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.categoryId) queryParams.append('categoryId', filters.categoryId);
      if (filters.languageId) queryParams.append('languageId', filters.languageId);
      if (sortConfig.key) {
        queryParams.append('sortBy', sortConfig.key);
        queryParams.append('sortOrder', sortConfig.direction);
      }

      const res = await fetch(`${API_BASE}/items?${queryParams.toString()}`, { headers: headers() });
      if (res.ok) setItemsData(await res.json());
    } catch (err) {
      console.error('Failed to fetch items:', err);
    }
  };

  useEffect(() => {
    fetchItems(itemsData.page);
  }, [sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

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

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_BASE}/items/${editingId}` : `${API_BASE}/items`;
      const res = await fetch(url, {
        method,
        headers: headers(),
        body: JSON.stringify(itemForm),
      });

      if (res.ok) {
        setToast({ type: 'success', message: editingId ? 'Item updated' : 'Item saved' });
        setItemForm({
          name: '',
          categoryId: categories[0]?.id || '',
          languageId: languages[0]?.id || '',
          isbn: '',
          isActive: true,
        });
        setEditingId(null);
        fetchItems(itemsData.page);
      } else {
        const error = await res.json();
        setToast({ type: 'error', message: error.message || res.statusText });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      const res = await fetch(`${API_BASE}/items/${id}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (res.ok || res.status === 204) {
        setToast({ type: 'success', message: 'Item deleted' });
        fetchItems(itemsData.page);
      } else {
        const error = await res.json();
        setToast({ type: 'error', message: error.message || res.statusText });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error' });
    }
  };

  const findCategoryName = (categoryId) => categories.find((cat) => cat.id === Number(categoryId))?.name || '-';
  const findLanguageName = (languageId) => languages.find((lang) => lang.id === Number(languageId))?.name || '-';

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_BASE}/items/export`, { headers: headers() });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ItemsMaster.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        setToast({ type: 'error', message: 'Failed to export' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Network error' });
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/items/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', message: data.message });
        fetchItems(1);
      } else {
        setToast({ type: 'error', message: data.message || 'Import failed' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Network error' });
    }
    e.target.value = null;
  };

  return (
    <section className="page-card">
      <div className="page-header">
        <div>
          <h2>Items Master</h2>
          <span className="page-badge">items_master</span>
          <p style={{ marginTop: 8 }}>Maintain item master details including category, language, quantity, and status.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input 
            type="file" 
            id="import-excel" 
            accept=".xlsx, .xls" 
            style={{ display: 'none' }} 
            onChange={handleImport}
          />
          <label htmlFor="import-excel" className="menu-btn" style={{ background: '#5C060E', color: 'white', textAlign: 'center', margin: 0 }}>
            Import Excel
          </label>
          <button onClick={handleExport} style={{ background: '#16a34a' }}>
            Export Excel
          </button>
        </div>
      </div>

      <section className="content-grid">
        <div className="card">
          <h3>{editingId ? 'Edit' : 'Add'} Item</h3>
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

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ flex: 1 }}>{editingId ? 'Update' : 'Save'} Item</button>
              {editingId && (
                <button type="button" onClick={() => { 
                  setEditingId(null); 
                  setItemForm({
                    name: '',
                    categoryId: categories[0]?.id || '',
                    languageId: languages[0]?.id || '',
                    isbn: '',
                    isActive: true,
                  });
                  setErrors({});
                }} style={{ background: '#64748b', flex: 1 }}>Cancel</button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <h3>Item List</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label className="field-label">Search (Name or ISBN)</label>
              <input placeholder="Search..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="field-label">Category</label>
              <select value={filters.categoryId} onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}>
                <option value="">All Categories</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="field-label">Language</label>
              <select value={filters.languageId} onChange={(e) => setFilters({ ...filters, languageId: e.target.value })}>
                <option value="">All Languages</option>
                {languages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => fetchItems(1)} style={{ padding: '10px 16px' }}>Filter</button>
              <button onClick={() => { setFilters({ search: '', categoryId: '', languageId: '' }); setTimeout(() => fetchItems(1), 0); }} style={{ padding: '10px 16px', background: '#64748b' }}>Clear</button>
            </div>
          </div>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Name{renderSortIcon('name')}</th>
                <th onClick={() => handleSort('categoryName')} style={{ cursor: 'pointer' }}>Category{renderSortIcon('categoryName')}</th>
                <th onClick={() => handleSort('languageName')} style={{ cursor: 'pointer' }}>Language{renderSortIcon('languageName')}</th>
                <th onClick={() => handleSort('isbn')} style={{ cursor: 'pointer' }}>ISBN{renderSortIcon('isbn')}</th>
                <th onClick={() => handleSort('isActive')} style={{ cursor: 'pointer' }}>Status{renderSortIcon('isActive')}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {itemsData.data.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  <td>{findCategoryName(item.categoryId)}</td>
                  <td>{findLanguageName(item.languageId)}</td>
                  <td>{item.isbn || '-'}</td>
                  <td>
                    <span className={item.isActive ? 'status-pill active' : 'status-pill'}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="icon-btn" title="Edit" onClick={() => {
                      setEditingId(item.id);
                      setItemForm({
                        name: item.name,
                        categoryId: item.categoryId || categories[0]?.id || '',
                        languageId: item.languageId || languages[0]?.id || '',
                        isbn: item.isbn || '',
                        isActive: !!item.isActive,
                      });
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button className="icon-btn danger" title="Delete" onClick={() => handleDelete(item.id)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button
              disabled={itemsData.page <= 1}
              onClick={() => fetchItems(itemsData.page - 1)}
            >
              Previous
            </button>
            <span>Page {itemsData.page} of {itemsData.totalPages}</span>
            <button
              disabled={itemsData.page >= itemsData.totalPages}
              onClick={() => fetchItems(itemsData.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}

export default ItemsMaster;
