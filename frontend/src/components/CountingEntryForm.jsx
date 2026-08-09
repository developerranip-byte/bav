import React, { useState, useEffect } from 'react';
import { API_BASE } from '../utils/api';
import Loader from './Loader';

const toLocalDateString = (d) => {
  if (!d) return '';
  const dateObj = new Date(d);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CountingEntryForm = ({ authHeaders, setToast }) => {
  const defaultForm = {
    date: toLocalDateString(new Date()),
    centerId: '',
    gentsCount: '',
    ladiesCount: '',
    childrenCount: '',
    balBoysCount: '',
    balGirlsCount: '',
    balPathiBoysCount: '',
    balPathiGirlsCount: '',
    mobileCount: '',
    luggageCount: '',
    threeWheelerCount: '',
    twoWheelerCount: '',
    fourWheelerCount: '',
    carInCount: '',
    carOutCount: ''
  };

  const [formData, setFormData] = useState(defaultForm);
  const [entries, setEntries] = useState([]);
  const [centers, setCenters] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEntriesAndCenters = async () => {
    setIsLoading(true);
    try {
      const [entriesRes, centersRes] = await Promise.all([
        fetch(`${API_BASE}/counting`, { headers: authHeaders() }),
        fetch(`${API_BASE}/centers`, { headers: authHeaders() })
      ]);
      
      if (entriesRes.ok) {
        setEntries(await entriesRes.json());
      }
      if (centersRes.ok) {
        const centersData = await centersRes.json();
        
        // Filter available centers for this user
        const uCenters = JSON.parse(localStorage.getItem('bav_user_centers') || '[]');
        const uType = localStorage.getItem('bav_user_type');
        let avail = uType === 'super_admin' ? centersData : centersData.filter(c => uCenters.includes(c.id));
        setCenters(avail);

        if (avail.length > 0 && !editingId && !formData.centerId) {
          setFormData(prev => ({ ...prev, centerId: avail[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntriesAndCenters();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Convert empty strings to 0
      const payload = { ...formData };
      for (const key in payload) {
        if (key !== 'date' && payload[key] === '') {
          payload[key] = 0;
        } else if (key !== 'date') {
          payload[key] = parseInt(payload[key], 10) || 0;
        }
      }

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_BASE}/counting/${editingId}` : `${API_BASE}/counting`;

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setToast({ type: 'success', message: `Counting entry ${editingId ? 'updated' : 'saved'} successfully!` });
        if (!editingId && data.id) {
          setEditingId(data.id);
        }
        fetchEntriesAndCenters();
      } else {
        const contentType = res.headers.get('content-type');
        let errorMsg = 'Failed to save entry';
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          errorMsg = data.message || errorMsg;
        } else {
          errorMsg = await res.text() || errorMsg;
        }
        setToast({ type: 'error', message: errorMsg });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Network error occurred' });
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setFormData({
      date: toLocalDateString(entry.countingDate),
      centerId: entry.centerId || '',
      gentsCount: entry.gentsCount || '',
      ladiesCount: entry.ladiesCount || '',
      childrenCount: entry.childrenCount || '',
      balBoysCount: entry.balSatsangBoysCount || '',
      balGirlsCount: entry.balSatsangGirlsCount || '',
      balPathiBoysCount: entry.balPathiBoysCount || '',
      balPathiGirlsCount: entry.balPathiGirlsCount || '',
      mobileCount: entry.mobileCount || '',
      luggageCount: entry.luggageCount || '',
      threeWheelerCount: entry.threeWheelerCount || '',
      twoWheelerCount: entry.twoWheelerCount || '',
      fourWheelerCount: entry.fourWheelerCount || '',
      carInCount: entry.carInCount || '',
      carOutCount: entry.carOutCount || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this counting entry?')) return;
    try {
      const res = await fetch(`${API_BASE}/counting/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok || res.status === 204) {
        setToast({ type: 'success', message: 'Counting entry deleted' });
        fetchEntriesAndCenters();
      } else {
        const text = await res.text();
        setToast({ type: 'error', message: text || 'Failed to delete' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Network error occurred' });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(defaultForm);
  };

  return (
    <section className="page-card">
      <div className="page-header no-print">
        <div>
          <h2>Counting Master</h2>
        </div>
        <p>Manage and record counting entries for satsangs and events.</p>
      </div>

      <div className="counting-form-container">
        <div className="counting-form-wrapper">
          <h2 className="form-title">{editingId ? 'Edit Counting Entry' : 'New Counting Entry'}</h2>
          <form onSubmit={handleSave} className="counting-form">
            <div className="form-section">
              <h3>Satsang Count</h3>
              <div className="form-row date-row multi-col">
                <label>
                  Date:
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label>
                  Center:
                  <select
                    name="centerId"
                    value={formData.centerId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Center</option>
                    {centers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3>Sangat Count</h3>
              <div className="form-row multi-col">
                <label>
                  Gents Count
                  <input type="number" name="gentsCount" value={formData.gentsCount} onChange={handleChange} min="0" />
                </label>
                <label>
                  Ladies
                  <input type="number" name="ladiesCount" value={formData.ladiesCount} onChange={handleChange} min="0" />
                </label>
                <label>
                  Children
                  <input type="number" name="childrenCount" value={formData.childrenCount} onChange={handleChange} min="0" />
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3>Bal Satsang Count</h3>
              <div className="form-row multi-col">
                <label>
                  Boys
                  <input type="number" name="balBoysCount" value={formData.balBoysCount} onChange={handleChange} min="0" />
                </label>
                <label>
                  Girls
                  <input type="number" name="balGirlsCount" value={formData.balGirlsCount} onChange={handleChange} min="0" />
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3>Bal Pathi</h3>
              <div className="form-row multi-col">
                <label>
                  Boys
                  <input type="number" name="balPathiBoysCount" value={formData.balPathiBoysCount} onChange={handleChange} min="0" />
                </label>
                <label>
                  Girls
                  <input type="number" name="balPathiGirlsCount" value={formData.balPathiGirlsCount} onChange={handleChange} min="0" />
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3>Luggage Count</h3>
              <div className="form-row multi-col">
                <label>
                  Mobile Count
                  <input type="number" name="mobileCount" value={formData.mobileCount} onChange={handleChange} min="0" />
                </label>
                <label>
                  Luggage Count
                  <input type="number" name="luggageCount" value={formData.luggageCount} onChange={handleChange} min="0" />
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3>Parking Count</h3>
              <div className="form-row multi-col">
                <label>
                  3 Wheeler
                  <input type="number" name="threeWheelerCount" value={formData.threeWheelerCount} onChange={handleChange} min="0" />
                </label>
                <label>
                  2 Wheeler
                  <input type="number" name="twoWheelerCount" value={formData.twoWheelerCount} onChange={handleChange} min="0" />
                </label>
                <label>
                  4 Wheeler
                  <input type="number" name="fourWheelerCount" value={formData.fourWheelerCount} onChange={handleChange} min="0" />
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3>SSCD Count</h3>
              <div className="form-row multi-col">
                <label>
                  Car In
                  <input type="number" name="carInCount" value={formData.carInCount} onChange={handleChange} min="0" />
                </label>
                <label>
                  Car Out
                  <input type="number" name="carOutCount" value={formData.carOutCount} onChange={handleChange} min="0" />
                </label>
              </div>
            </div>

            <div className="form-actions no-print">
              <button type="button" className="btn btn-secondary" onClick={handleExportPDF}>Export to PDF</button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={cancelEdit}>Add New Entry</button>
              )}
              <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Save'}</button>
            </div>
          </form>
        </div>
      </div>

      <div className="card no-print" style={{ marginTop: '24px', overflowX: 'auto' }}>
        <h3>Previous Entries</h3>
        <div className="loading-state">
          {isLoading && <Loader overlay />}
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Center</th>
                <th>Total Sangat</th>
                <th>Total Bal Satsang</th>
                <th>Total Bal Pathi</th>
                <th>Mobile</th>
                <th>Luggage</th>
                <th>Total Parking</th>
                <th>SSCD Car In</th>
                <th>SSCD Car Out</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const totalSangat = (entry.gentsCount || 0) + (entry.ladiesCount || 0) + (entry.childrenCount || 0);
                const totalBalSatsang = (entry.balSatsangBoysCount || 0) + (entry.balSatsangGirlsCount || 0);
                const totalBalPathi = (entry.balPathiBoysCount || 0) + (entry.balPathiGirlsCount || 0);
                const totalParking = (entry.threeWheelerCount || 0) + (entry.twoWheelerCount || 0) + (entry.fourWheelerCount || 0);

                return (
                  <tr key={entry.id}>
                    <td><strong>{entry.countingDate ? toLocalDateString(entry.countingDate) : '-'}</strong></td>
                    <td>{entry.centerName || '-'}</td>
                    <td>{totalSangat}</td>
                    <td>{totalBalSatsang}</td>
                    <td>{totalBalPathi}</td>
                    <td>{entry.mobileCount || 0}</td>
                    <td>{entry.luggageCount || 0}</td>
                    <td>{totalParking}</td>
                    <td>{entry.carInCount || 0}</td>
                    <td>{entry.carOutCount || 0}</td>
                    <td>
                      <button className="icon-btn" title="Edit" onClick={() => handleEdit(entry)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button className="icon-btn danger" title="Delete" onClick={() => handleDelete(entry.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {entries.length === 0 && (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>No entries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default CountingEntryForm;
