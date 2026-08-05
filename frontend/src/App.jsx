import { useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import CategoryMaster from './components/CategoryMaster';
import CenterMaster from './components/CenterMaster';
import ItemsMaster from './components/ItemsMaster';
import LanguageMaster from './components/LanguageMaster';
import PurchaseMaster from './components/PurchaseMaster';
import SalesMaster from './components/SalesMaster';
import ReportMaster from './components/ReportMaster';
import UserMaster from './components/UserMaster';
import SeedMaster from './components/SeedMaster';
import Login from './components/Login';
import CountingEntryForm from './components/CountingEntryForm';
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
  const [userCenters, setUserCenters] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bav_user_centers') || '[]'); } catch { return []; }
  });
  const [userType, setUserType] = useState(localStorage.getItem('bav_user_type'));
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(authToken));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({ book: false });

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const navigateTo = (menu, path) => {
    setActiveMenu(menu);
    navigate(path);
    setIsMobileMenuOpen(false);
  };

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
        setUserCenters(data.centers || []);
        setUserType(data.userType);
        setIsAuthenticated(true);
        localStorage.setItem('bav_auth_token', data.token);
        localStorage.setItem('bav_user_modules', JSON.stringify(data.modules || []));
        localStorage.setItem('bav_user_centers', JSON.stringify(data.centers || []));
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
    setUserCenters([]);
    setUserType(null);
    setIsAuthenticated(false);
    localStorage.removeItem('bav_auth_token');
    localStorage.removeItem('bav_user_modules');
    localStorage.removeItem('bav_user_centers');
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
    } else if (location.pathname === '/centers') {
      setActiveMenu('centers');
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
    } else if (location.pathname === '/counting') {
      setActiveMenu('counting');
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
      
      {isMobileMenuOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <h2>BAV Panel</h2>
        <p>Book Audio Video Management</p>
        <nav>
          {userModules.includes('dashboard') && (
            <button className={activeMenu === 'dashboard' ? 'menu-btn active' : 'menu-btn'} onClick={() => navigateTo('dashboard', '/')}>
              Dashboard
            </button>
          )}
          {userModules.includes('centers') && (
            <button className={activeMenu === 'centers' ? 'menu-btn active' : 'menu-btn'} onClick={() => navigateTo('centers', '/centers')}>
              Center Master
            </button>
          )}

          <div className="menu-group">
            <button className="menu-group-header" onClick={() => toggleMenu('book')}>
              Book {openMenus.book ? '▼' : '▶'}
            </button>
            {openMenus.book && (
              <div className="menu-group-content">
                {userModules.includes('languages') && (
                  <button className={activeMenu === 'languages' ? 'menu-btn active' : 'menu-btn'} onClick={() => navigateTo('languages', '/language')}>
                    Language Master
                  </button>
                )}
                {userModules.includes('categories') && (
                  <button className={activeMenu === 'categories' ? 'menu-btn active' : 'menu-btn'} onClick={() => navigateTo('categories', '/category')}>
                    Category Master
                  </button>
                )}
                {userModules.includes('items') && (
                  <button className={activeMenu === 'items' ? 'menu-btn active' : 'menu-btn'} onClick={() => navigateTo('items', '/items')}>
                    Items Master
                  </button>
                )}
                {userModules.includes('purchase') && (
                  <button className={activeMenu === 'purchase' ? 'menu-btn active' : 'menu-btn'} onClick={() => navigateTo('purchase', '/purchase')}>
                    Stock Master
                  </button>
                )}
                {userModules.includes('sales') && (
                  <button className={activeMenu === 'sales' ? 'menu-btn active' : 'menu-btn'} onClick={() => navigateTo('sales', '/sales')}>
                    Sales Master
                  </button>
                )}
                {userModules.includes('report') && (
                  <button className={activeMenu === 'report' ? 'menu-btn active' : 'menu-btn'} onClick={() => navigateTo('report', '/report')}>
                    Report Master
                  </button>
                )}
              </div>
            )}
          </div>
          {userModules.includes('counting') && (
            <button className={activeMenu === 'counting' ? 'menu-btn active' : 'menu-btn'} onClick={() => navigateTo('counting', '/counting')}>
              Counting Entry
            </button>
          )}
          {userModules.includes('users') && (
            <button className={activeMenu === 'users' ? 'menu-btn active' : 'menu-btn'} onClick={() => navigateTo('users', '/users')}>
              User Master
            </button>
          )}
          {userType === 'super_admin' && (
            <button className={activeMenu === 'seed' ? 'menu-btn active' : 'menu-btn'} onClick={() => navigateTo('seed', '/seed')}>
              Seed Scripts
            </button>
          )}
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="mobile-menu-btn icon-btn" onClick={() => setIsMobileMenuOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <h1>{activeMenu === 'dashboard' ? 'Main Dashboard' : activeMenu === 'languages' ? 'Language Master' : activeMenu === 'categories' ? 'Category Master' : activeMenu === 'centers' ? 'Center Master' : activeMenu === 'items' ? 'Items Master' : activeMenu === 'purchase' ? 'Stock Master' : activeMenu === 'sales' ? 'Sales Master' : activeMenu === 'users' ? 'User Master' : activeMenu === 'seed' ? 'Seed Scripts' : activeMenu === 'counting' ? 'Counting Entry' : 'Report Master'}</h1>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </header>

        <Routes>
          {userModules.includes('languages') && <Route path="/language" element={<LanguageMaster authHeaders={authHeaders} setToast={setToast} />} />}
          {userModules.includes('categories') && <Route path="/category" element={<CategoryMaster authHeaders={authHeaders} setToast={setToast} />} />}
          {userModules.includes('centers') && <Route path="/centers" element={<CenterMaster setToast={setToast} />} />}
          {userModules.includes('items') && <Route path="/items" element={<ItemsMaster authHeaders={authHeaders} setToast={setToast} />} />}
          {userModules.includes('purchase') && <Route path="/purchase" element={<PurchaseMaster authHeaders={authHeaders} setToast={setToast} />} />}
          {userModules.includes('sales') && <Route path="/sales" element={<SalesMaster authHeaders={authHeaders} setToast={setToast} />} />}
          {userModules.includes('report') && <Route path="/report" element={<ReportMaster authHeaders={authHeaders} setToast={setToast} />} />}
          {userModules.includes('counting') && <Route path="/counting" element={<CountingEntryForm authHeaders={authHeaders} setToast={setToast} />} />}
          {userModules.includes('users') && <Route path="/users" element={<UserMaster authHeaders={authHeaders} setToast={setToast} />} />}
          {userType === 'super_admin' && <Route path="/seed" element={<SeedMaster setToast={setToast} />} />}
          <Route path="/" element={<Dashboard authHeaders={authHeaders} />} />
          <Route path="*" element={<UnauthorizedRedirect setToast={setToast} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
