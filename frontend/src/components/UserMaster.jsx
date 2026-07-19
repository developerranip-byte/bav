import { useEffect, useState } from 'react';
import { API_BASE } from '../utils/api';

const AVAILABLE_MODULES = [
  { id: 'dashboard', label: 'Main Dashboard' },
  { id: 'languages', label: 'Language Master' },
  { id: 'categories', label: 'Category Master' },
  { id: 'items', label: 'Items Master' },
  { id: 'purchase', label: 'Stock Master' },
  { id: 'sales', label: 'Sales Master' },
  { id: 'report', label: 'Report Master' },
  { id: 'users', label: 'User Master' }
];

function UserMaster({ authHeaders, setToast }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ id: null, username: '', password: '', userType: 'user', isActive: 1, modules: [] });
  const [isEditing, setIsEditing] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, { headers: authHeaders() });
      if (res.ok) {
        setUsers(await res.json());
      } else {
        setToast({ type: 'error', message: 'Failed to fetch users (Access Denied?)' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Network error' });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username) return setToast({ type: 'error', message: 'Username is required' });
    if (!isEditing && !form.password) return setToast({ type: 'error', message: 'Password is required for new users' });

    try {
      const url = isEditing ? `${API_BASE}/users/${form.id}` : `${API_BASE}/users`;
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setToast({ type: 'success', message: `User ${isEditing ? 'updated' : 'created'} successfully` });
        setForm({ id: null, username: '', password: '', userType: 'user', isActive: 1, modules: [] });
        setIsEditing(false);
        fetchUsers();
      } else {
        const error = await res.json();
        setToast({ type: 'error', message: error.message || 'Error saving user' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Network error' });
    }
  };

  const editUser = (user) => {
    let parsedModules = [];
    if (user.modules) {
      try {
        parsedModules = typeof user.modules === 'string' ? JSON.parse(user.modules) : user.modules;
      } catch(e) {}
    }
    setForm({ id: user.id, username: user.username, password: '', userType: user.userType, isActive: user.isActive, modules: parsedModules });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setForm({ id: null, username: '', password: '', userType: 'user', isActive: 1, modules: [] });
    setIsEditing(false);
  };

  return (
    <section className="page-card">
      <div className="page-header">
        <div>
          <h2>User Master</h2>
          <span className="page-badge">user_master</span>
        </div>
        <p>Manage system users, roles, and access controls.</p>
      </div>

      <section className="content-grid">
        <div className="card">
          <h3>{isEditing ? 'Edit User' : 'Add New User'}</h3>
          <form onSubmit={handleSubmit}>
            <label className="field-label">Username</label>
            <input
              placeholder="Username"
              value={form.username}
              readOnly={isEditing}
              style={isEditing ? { background: '#f1f5f9', color: '#64748b' } : {}}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />

            <label className="field-label">{isEditing ? 'New Password (leave blank to keep current)' : 'Password'}</label>
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <label className="field-label">User Role</label>
            <select value={form.userType} onChange={(e) => setForm({ ...form, userType: e.target.value })}>
              <option value="user">User (Limited Access)</option>
              <option value="admin">Admin (Full Access)</option>
              <option value="super_admin">Super Admin</option>
            </select>

            {isEditing && (
              <>
                <label className="field-label">Status</label>
                <select value={form.isActive} onChange={(e) => setForm({ ...form, isActive: Number(e.target.value) })}>
                  <option value={1}>Active</option>
                  <option value={0}>Disabled</option>
                </select>
              </>
            )}

            {form.userType !== 'super_admin' && (
              <>
                <label className="field-label" style={{ marginTop: '16px' }}>Custom Module Access (Optional)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  {AVAILABLE_MODULES.map(mod => (
                    <label key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={form.modules.includes(mod.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({ ...form, modules: [...form.modules, mod.id] });
                          } else {
                            setForm({ ...form, modules: form.modules.filter(m => m !== mod.id) });
                          }
                        }}
                      />
                      {mod.label}
                    </label>
                  ))}
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '-10px', marginBottom: '20px' }}>
                  If no modules are selected, the user will inherit default modules based on their role.
                </p>
              </>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ flex: 1 }}>{isEditing ? 'Update User' : 'Create User'}</button>
              {isEditing && (
                <button type="button" onClick={cancelEdit} style={{ background: '#64748b', flex: 1 }}>Cancel</button>
              )}
            </div>
          </form>
        </div>

        <div className="card" style={{ overflowX: 'auto' }}>
          <h3>System Users</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td data-label="Username"><strong>{user.username}</strong></td>
                  <td data-label="Role"><span className="badge book">{user.userType.replace('_', ' ')}</span></td>
                  <td data-label="Status">
                    <span className={`status-pill ${user.isActive ? 'active' : ''}`}>
                      {user.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <button className="icon-btn" title="Edit" onClick={() => editUser(user)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: '#64748b' }}>No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

export default UserMaster;
