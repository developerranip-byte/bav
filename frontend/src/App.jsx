import { useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import CategoryMaster from './components/CategoryMaster';
import ItemsMaster from './components/ItemsMaster';
import LanguageMaster from './components/LanguageMaster';
import PurchaseMaster from './components/PurchaseMaster';
import SalesMaster from './components/SalesMaster';
import ReportMaster from './components/ReportMaster';
import UserMaster from './components/UserMaster';
import Login from './components/Login';
import { API_BASE, createAuthHeaders } from './utils/api';

function UnauthorizedRedirect({ setToast }) {
  useEffect(() => {
    setToast({ type: 'error', message: 'You do not have access to this module.' });
  }, [setToast]);
  return <Navigate to="/" replace />;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('bav_auth_token'));
  const [userModules, setUserModules] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bav_user_modules') || '[]'); } catch { return []; }
  });
  const [userType, setUserType] = useState(localStorage.getItem('bav_user_type'));
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(authToken));

  const authHeaders = () => createAuthHeaders(authToken);

  const handleLogin = async ({ username, password }) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setAuthToken(data.token);
        setUserModules(data.modules || []);
        setUserType(data.userType);
        setIsAuthenticated(true);
        localStorage.setItem('bav_auth_token', data.token);
        localStorage.setItem('bav_user_modules', JSON.stringify(data.modules || []));
        localStorage.setItem('bav_user_type', data.userType);
        setToast({ type: 'success', message: 'Logged in successfully' });
        navigate('/');
      } else {
        const text = await res.text();
        setToast({ type: 'error', message: text || 'Login failed' });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error' });
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: authHeaders(),
      });
    } catch {
      // ignore logout failure
    }
    setAuthToken(null);
    setUserModules([]);
    setUserType(null);
    setIsAuthenticated(false);
    localStorage.removeItem('bav_auth_token');
    localStorage.removeItem('bav_user_modules');
    localStorage.removeItem('bav_user_type');
    setToast({ type: 'success', message: 'Logged out successfully' });
    navigate('/login');
  };

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (location.pathname === '/language') {
      setActiveMenu('languages');
    } else if (location.pathname === '/category') {
      setActiveMenu('categories');
    } else if (location.pathname === '/items') {
      setActiveMenu('items');
    } else if (location.pathname === '/purchase') {
      setActiveMenu('purchase');
    } else if (location.pathname === '/sales') {
      setActiveMenu('sales');
    } else if (location.pathname === '/report') {
      setActiveMenu('report');
    } else if (location.pathname === '/users') {
      setActiveMenu('users');
    } else {
      setActiveMenu('dashboard');
    }
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">

      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            padding: '10px 14px',
            background: toast.type === 'success' ? '#28a745' : '#dc3545',
            color: '#fff',
            borderRadius: 6,
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          {toast.message}
        </div>
      )}
      <aside className="sidebar">
        <h2>BAV Panel</h2>
        <p>Book Audio Video Management</p>
        <nav>
          {userModules.includes('dashboard') && (
            <button className={activeMenu === 'dashboard' ? 'menu-btn active' : 'menu-btn'} onClick={() => { setActiveMenu('dashboard'); navigate('/'); }}>
              Dashboard
            </button>
          )}
          {userModules.includes('languages') && (
            <button className={activeMenu === 'languages' ? 'menu-btn active' : 'menu-btn'} onClick={() => { setActiveMenu('languages'); navigate('/language'); }}>
              Language Master
            </button>
          )}
          {userModules.includes('categories') && (
            <button className={activeMenu === 'categories' ? 'menu-btn active' : 'menu-btn'} onClick={() => { setActiveMenu('categories'); navigate('/category'); }}>
              Category Master
            </button>
          )}
          {userModules.includes('items') && (
            <button className={activeMenu === 'items' ? 'menu-btn active' : 'menu-btn'} onClick={() => { setActiveMenu('items'); navigate('/items'); }}>
              Items Master
            </button>
          )}
          {userModules.includes('purchase') && (
            <button className={activeMenu === 'purchase' ? 'menu-btn active' : 'menu-btn'} onClick={() => { setActiveMenu('purchase'); navigate('/purchase'); }}>
              Purchase Master
            </button>
          )}
          {userModules.includes('sales') && (
            <button className={activeMenu === 'sales' ? 'menu-btn active' : 'menu-btn'} onClick={() => { setActiveMenu('sales'); navigate('/sales'); }}>
              Sales Master
            </button>
          )}
          {userModules.includes('report') && (
            <button className={activeMenu === 'report' ? 'menu-btn active' : 'menu-btn'} onClick={() => { setActiveMenu('report'); navigate('/report'); }}>
              Report Master
            </button>
          )}
          {userModules.includes('users') && (
            <button className={activeMenu === 'users' ? 'menu-btn active' : 'menu-btn'} onClick={() => { setActiveMenu('users'); navigate('/users'); }}>
              User Master
            </button>
          )}
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>{activeMenu === 'dashboard' ? 'Main Dashboard' : activeMenu === 'languages' ? 'Language Master' : activeMenu === 'categories' ? 'Category Master' : activeMenu === 'items' ? 'Items Master' : activeMenu === 'purchase' ? 'Purchase Master' : activeMenu === 'sales' ? 'Sales Master' : activeMenu === 'users' ? 'User Master' : 'Report Master'}</h1>
            <p>Organize your library with a modern control panel.</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </header>

        <Routes>
          {userModules.includes('languages') && <Route path="/language" element={<LanguageMaster authHeaders={authHeaders} setToast={setToast} />} />}
          {userModules.includes('categories') && <Route path="/category" element={<CategoryMaster authHeaders={authHeaders} setToast={setToast} />} />}
          {userModules.includes('items') && <Route path="/items" element={<ItemsMaster authHeaders={authHeaders} setToast={setToast} />} />}
          {userModules.includes('purchase') && <Route path="/purchase" element={<PurchaseMaster authHeaders={authHeaders} setToast={setToast} />} />}
          {userModules.includes('sales') && <Route path="/sales" element={<SalesMaster authHeaders={authHeaders} setToast={setToast} />} />}
          {userModules.includes('report') && <Route path="/report" element={<ReportMaster authHeaders={authHeaders} setToast={setToast} />} />}
          {userModules.includes('users') && <Route path="/users" element={<UserMaster authHeaders={authHeaders} setToast={setToast} />} />}
          <Route path="/" element={<Dashboard authHeaders={authHeaders} />} />
          <Route path="*" element={<UnauthorizedRedirect setToast={setToast} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
