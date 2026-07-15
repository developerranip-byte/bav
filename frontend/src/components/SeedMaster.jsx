import { useEffect, useState } from 'react';
import { API_BASE, createAuthHeaders } from '../utils/api';

function SeedMaster({ setToast }) {
  const [scripts, setScripts] = useState([]);
  const [running, setRunning] = useState(null);
  const [output, setOutput] = useState('');

  const token = localStorage.getItem('bav_auth_token');
  const headers = () => createAuthHeaders(token);

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    try {
      // The API endpoint isn't behind auth middleware right now, but we send it just in case
      const res = await fetch(`${API_BASE}/scripts/list`, { headers: headers() });
      if (res.ok) {
        setScripts(await res.json());
      } else {
        setToast({ type: 'error', message: 'Failed to fetch scripts' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Network error' });
    }
  };

  const handleRunScript = async (scriptName) => {
    if (!window.confirm(`Are you sure you want to run ${scriptName}? This may modify your database.`)) return;
    
    setRunning(scriptName);
    setOutput(`Running ${scriptName}...\n`);
    try {
      const res = await fetch(`${API_BASE}/scripts/run/${scriptName}`, {
        headers: headers()
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', message: data.message });
        setOutput((prev) => prev + `\n--- SUCCESS ---\n${data.stdout || 'No output'}`);
      } else {
        setToast({ type: 'error', message: data.message || 'Script failed' });
        setOutput((prev) => prev + `\n--- ERROR ---\n${data.stderr || data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Network error' });
      setOutput((prev) => prev + `\n--- ERROR ---\nNetwork request failed.`);
    } finally {
      setRunning(null);
    }
  };

  return (
    <section className="page-card">
      <div className="page-header">
        <div>
          <h2>Seed Report</h2>
          <p className="page-subtitle">Dynamically run any seed script located in the backend root directory.</p>
        </div>
      </div>

      <section className="content-grid">
        <div className="card">
          <h3>Available Scripts</h3>
          <table className="data-table" style={{ width: '100%', marginTop: '16px' }}>
            <thead>
              <tr>
                <th>Script Name</th>
                <th style={{ width: '120px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {scripts.map((script) => (
                <tr key={script}>
                  <td><strong>{script}</strong></td>
                  <td>
                    <button 
                      onClick={() => handleRunScript(script)}
                      disabled={running === script}
                      style={{ 
                        background: running === script ? '#64748b' : '#5C060E',
                        padding: '6px 12px',
                        fontSize: '12px'
                      }}
                    >
                      {running === script ? 'Running...' : 'Run Script'}
                    </button>
                  </td>
                </tr>
              ))}
              {scripts.length === 0 && (
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center' }}>No scripts found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Console Output</h3>
          <pre style={{
            background: '#1e293b',
            color: '#f8fafc',
            padding: '16px',
            borderRadius: '8px',
            minHeight: '200px',
            maxHeight: '500px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap'
          }}>
            {output || 'Run a script to see output here...'}
          </pre>
        </div>
      </section>
    </section>
  );
}

export default SeedMaster;
