import { useEffect, useState } from 'react';
import { API_BASE, createAuthHeaders } from '../utils/api';
import Loader from './Loader';

function CenterMaster({ setToast }) {
  const [centers, setCenters] = useState([]);
  const [centerForm, setCenterForm] = useState({ name: '', location: '', isActive: true });
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const token = localStorage.getItem('bav_auth_token');
  const headers = () => createAuthHeaders(token);

  const fetchCenters = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/centers`, { headers: headers() });
      if (res.ok) {
        setCenters(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch centers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCenters();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!centerForm.name || !centerForm.name.trim()) nextErrors.name = 'Center name is required';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_BASE}/centers/${editingId}` : `${API_BASE}/centers`;
      const res = await fetch(url, {
        method,
        headers: headers(),
        body: JSON.stringify(centerForm),
      });

      if (res.ok) {
        setToast({ type: 'success', message: editingId ? 'Center updated' : 'Center saved' });
        setCenterForm({ name: '', location: '', isActive: true });
        setEditingId(null);
        fetchCenters();
      } else {
        const error = await res.json();
        setToast({ type: 'error', message: error.message || res.statusText });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this center?')) return;
    try {
      const res = await fetch(`${API_BASE}/centers/${id}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (res.ok || res.status === 204) {
        setToast({ type: 'success', message: 'Center deleted' });
        fetchCenters();
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
          <h2>Center Master</h2>
        </div>
        <p>Maintain center information and locations.</p>
      </div>

      <section className="content-grid">
        <div className="card">
          <h3>{editingId ? 'Edit' : 'Add'} Center</h3>
          <form onSubmit={handleSubmit}>
            <label className="field-label">Center Name</label>
            <input
              placeholder="Enter center name"
              value={centerForm.name}
              onChange={(e) => setCenterForm({ ...centerForm, name: e.target.value })}
            />
            {errors.name && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{errors.name}</div>}
            
            <label className="field-label">Location</label>
            <input
              placeholder="Enter location"
              value={centerForm.location}
              onChange={(e) => setCenterForm({ ...centerForm, location: e.target.value })}
            />

            <label className="field-label">Is Active</label>
            <select
              value={centerForm.isActive ? 'true' : 'false'}
              onChange={(e) => setCenterForm({ ...centerForm, isActive: e.target.value === 'true' })}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ flex: 1 }}>{editingId ? 'Update' : 'Save'} Center</button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setCenterForm({ name: '', location: '', isActive: true }); setErrors({}); }} style={{ background: '#64748b', flex: 1 }}>Cancel</button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <h3>Available Centers</h3>
          <div className="loading-state">
            {isLoading && <Loader overlay />}
            <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {centers.map((center) => (
                <tr key={center.id}>
                  <td>{center.name}</td>
                  <td>{center.location || '-'}</td>
                  <td>
                    <span className={center.isActive ? 'status-pill active' : 'status-pill'}>
                      {center.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="icon-btn" title="Edit" onClick={() => {
                      setEditingId(center.id);
                      setCenterForm({ name: center.name, location: center.location || '', isActive: !!center.isActive });
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button className="icon-btn danger" title="Delete" onClick={() => handleDelete(center.id)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </section>
    </section>
  );
}

export default CenterMaster;
