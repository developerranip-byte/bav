import { useState } from 'react';

function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username.trim() || !form.password.trim()) {
      setError('Username and password are required');
      return;
    }
    onLogin(form);
  };

  return (
    <section className="page-card" style={{ maxWidth: 420, margin: '40px auto' }}>
      <div className="page-header">
        <div>
          <h2>Admin Login</h2>
          <span className="page-badge">auth</span>
        </div>
        <p>Use the default admin credentials to access the application.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <label className="field-label">Username</label>
        <input
          placeholder="Enter username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />

        <label className="field-label">Password</label>
        <input
          type="password"
          placeholder="Enter password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        {error && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{error}</div>}
        <button type="submit">Login</button>
      </form>
    </section>
  );
}

export default Login;
