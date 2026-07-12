import { useEffect, useState } from 'react';
import { API_BASE, createAuthHeaders } from '../utils/api';

function LanguageMaster({ setToast }) {
  const [languages, setLanguages] = useState([]);
  const [languageForm, setLanguageForm] = useState({ name: '', code: '', isActive: true });
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  const token = localStorage.getItem('bav_auth_token');
  const headers = () => createAuthHeaders(token);

  const fetchLanguages = async () => {
    try {
      const res = await fetch(`${API_BASE}/languages`, { headers: headers() });
      if (res.ok) {
        setLanguages(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch languages:', err);
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!languageForm.name || !languageForm.name.trim()) nextErrors.name = 'Name is required';
    if (!languageForm.code || !languageForm.code.trim()) nextErrors.code = 'Code is required';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_BASE}/languages/${editingId}` : `${API_BASE}/languages`;
      const res = await fetch(url, {
        method,
        headers: headers(),
        body: JSON.stringify(languageForm),
      });

      if (res.ok) {
        setToast({ type: 'success', message: editingId ? 'Language updated' : 'Language saved' });
        setLanguageForm({ name: '', code: '', isActive: true });
        setEditingId(null);
        fetchLanguages();
      } else {
        const error = await res.json();
        setToast({ type: 'error', message: error.message || res.statusText });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this language?')) return;
    try {
      const res = await fetch(`${API_BASE}/languages/${id}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (res.ok || res.status === 204) {
        setToast({ type: 'success', message: 'Language deleted' });
        fetchLanguages();
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
          <h2>Language Master</h2>
          <span className="page-badge">language_master</span>
        </div>
        <p>Maintain language information and quick access from this page.</p>
      </div>

      <section className="content-grid">
        <div className="card">
          <h3>{editingId ? 'Edit' : 'Add'} Language</h3>
          <form onSubmit={handleSubmit}>
            <label className="field-label">Language Name</label>
            <input
              placeholder="Enter language name"
              value={languageForm.name}
              onChange={(e) => setLanguageForm({ ...languageForm, name: e.target.value })}
            />
            {errors.name && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{errors.name}</div>}
            <label className="field-label">Language Code</label>
            <input
              placeholder="Enter language code"
              value={languageForm.code}
              onChange={(e) => setLanguageForm({ ...languageForm, code: e.target.value })}
            />
            {errors.code && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{errors.code}</div>}

            <label className="field-label">Is Active</label>
            <select
              value={languageForm.isActive ? 'true' : 'false'}
              onChange={(e) => setLanguageForm({ ...languageForm, isActive: e.target.value === 'true' })}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ flex: 1 }}>{editingId ? 'Update' : 'Save'} Language</button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setLanguageForm({ name: '', code: '', isActive: true }); setErrors({}); }} style={{ background: '#64748b', flex: 1 }}>Cancel</button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <h3>Available Languages</h3>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {languages.map((language) => (
                <tr key={language.id}>
                  <td>{language.name}</td>
                  <td>{language.code}</td>
                  <td>
                    <span className={language.isActive ? 'status-pill active' : 'status-pill'}>
                      {language.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => {
                      setEditingId(language.id);
                      setLanguageForm({ name: language.name, code: language.code, isActive: !!language.isActive });
                    }} style={{ marginRight: 8 }}>Edit</button>
                    <button onClick={() => handleDelete(language.id)} className="danger">Delete</button>
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

export default LanguageMaster;
