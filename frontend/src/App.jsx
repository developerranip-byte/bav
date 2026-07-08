import { useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import CategoryMaster from './components/CategoryMaster';
import ItemsMaster from './components/ItemsMaster';
import LanguageMaster from './components/LanguageMaster';
import PurchaseMaster from './components/PurchaseMaster';
import SalesMaster from './components/SalesMaster';
import ReportMaster from './components/ReportMaster';
import Login from './components/Login';

const API_BASE = 'http://localhost:5000/api';
// Temporary feature flag: hide media items UI and stop fetching items
const HIDE_MEDIA = true;

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [items, setItems] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState({
    title: '',
    type: 'book',
    author: '',
    description: '',
  });
  const initialToken = localStorage.getItem('bav_auth_token');
  const [toast, setToast] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [authToken, setAuthToken] = useState(initialToken);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(initialToken));

  const authHeaders = () => ({
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    'Content-Type': 'application/json',
  });

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
        setIsAuthenticated(true);
        localStorage.setItem('bav_auth_token', data.token);
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
    setIsAuthenticated(false);
    localStorage.removeItem('bav_auth_token');
    setToast({ type: 'success', message: 'Logged out successfully' });
    navigate('/login');
  };

  const handleAuthError = () => {
    setAuthToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('bav_auth_token');
    navigate('/login');
  };

  const fetchCategories = async () => {
    const res = await fetch(`${API_BASE}/categories`, { headers: authHeaders() });
    if (res.ok) setCategories(await res.json());
    else if (res.status === 401) handleAuthError();
  };

  const fetchLanguages = async () => {
    const res = await fetch(`${API_BASE}/languages`, { headers: authHeaders() });
    if (res.ok) setLanguages(await res.json());
    else if (res.status === 401) handleAuthError();
  };

  const fetchItems = async () => {
    const res = await fetch(`${API_BASE}/items`, { headers: authHeaders() });
    if (res.ok) setItems(await res.json());
    else if (res.status === 401) handleAuthError();
  };

  const fetchPurchases = async () => {
    const res = await fetch(`${API_BASE}/purchases`, { headers: authHeaders() });
    if (res.ok) setPurchases(await res.json());
    else if (res.status === 401) handleAuthError();
  };

  const fetchSales = async () => {
    const res = await fetch(`${API_BASE}/sales`, { headers: authHeaders() });
    if (res.ok) setSales(await res.json());
    else if (res.status === 401) handleAuthError();
  };

  const fetchReports = async () => {
    const res = await fetch(`${API_BASE}/reports`, { headers: authHeaders() });
    if (res.ok) setReports(await res.json());
    else if (res.status === 401) handleAuthError();
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
      fetchLanguages();
      fetchItems();
      fetchPurchases();
      fetchSales();
      fetchReports();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    // client-side validation
    const nextErrors = {};
    if (!form.title || !form.title.trim()) nextErrors.title = 'Title is required';
    if (!form.author || !form.author.trim()) nextErrors.author = 'Author is required';
    if (!form.description || !form.description.trim()) nextErrors.description = 'Description is required';
    if (Object.keys(nextErrors).length) {
      setFormErrors(nextErrors);
      return;
    }
    setFormErrors({});

    try {
      const res = await fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setToast({ type: 'success', message: 'Item saved' });
        setForm({ title: '', type: 'book', author: '', description: '' });
        fetchItems();
      } else {
        const text = await res.text();
        setToast({ type: 'error', message: text || res.statusText });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error' });
    }
  };

  const handleAddCategory = async (category) => {
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(category),
      });
      if (res.ok) {
        setToast({ type: 'success', message: 'Category saved' });
        fetchCategories();
      } else {
        const text = await res.text();
        setToast({ type: 'error', message: text || res.statusText });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error' });
    }
  };

  const handleUpdateCategory = async (id, category) => {
    try {
      const res = await fetch(`${API_BASE}/categories/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(category),
      });
      if (res.ok) {
        setToast({ type: 'success', message: 'Category updated' });
        fetchCategories();
      } else {
        const text = await res.text();
        setToast({ type: 'error', message: text || res.statusText });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error' });
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      const res = await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok || res.status === 204) {
        setToast({ type: 'success', message: 'Category deleted' });
        fetchCategories();
      } else {
        const text = await res.text();
        setToast({ type: 'error', message: text || res.statusText });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error' });
    }
  };

  const handleAddLanguage = async (language) => {
    try {
      const res = await fetch(`${API_BASE}/languages`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(language),
      });
      if (res.ok) {
        setToast({ type: 'success', message: 'Language saved' });
        fetchLanguages();
      } else {
        const text = await res.text();
        setToast({ type: 'error', message: text || res.statusText });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error' });
    }
  };

  const handleUpdateLanguage = async (id, language) => {
    try {
      const res = await fetch(`${API_BASE}/languages/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(language),
      });
      if (res.ok) {
        setToast({ type: 'success', message: 'Language updated' });
        fetchLanguages();
      } else {
        const text = await res.text();
        setToast({ type: 'error', message: text || res.statusText });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error' });
    }
  };

  const handleDeleteLanguage = async (id) => {
    if (!window.confirm('Delete this language?')) return;
    try {
      const res = await fetch(`${API_BASE}/languages/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok || res.status === 204) {
        setToast({ type: 'success', message: 'Language deleted' });
        fetchLanguages();
      } else {
        const text = await res.text();
        setToast({ type: 'error', message: text || res.statusText });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error' });
    }
  };

  const handleAddItem = async (item) => {
    try {
      const res = await fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(item),
      });
      if (res.ok) {
        setToast({ type: 'success', message: 'Item saved' });
        fetchItems();
      } else {
        const text = await res.text();
        setToast({ type: 'error', message: text || res.statusText });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error' });
    }
  };

  const handleUpdateItem = async (id, item) => {
    try {
      const res = await fetch(`${API_BASE}/items/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(item),
      });
      if (res.ok) {
        setToast({ type: 'success', message: 'Item updated' });
        fetchItems();
      } else {
        const text = await res.text();
        setToast({ type: 'error', message: text || res.statusText });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error' });
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      const res = await fetch(`${API_BASE}/items/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok || res.status === 204) {
        setToast({ type: 'success', message: 'Item deleted' });
        fetchItems();
      } else {
        const text = await res.text();
        setToast({ type: 'error', message: text || res.statusText });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error' });
    }
  };

  const handleAddPurchase = async (purchase) => {
    try {
      const res = await fetch(`${API_BASE}/purchases`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(purchase),
      });
      if (res.ok) {
        setToast({ type: 'success', message: 'Purchase recorded' });
        fetchPurchases();
      } else {
        const text = await res.text();
        setToast({ type: 'error', message: text || res.statusText });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error' });
    }
  };

  const handleAddSale = async (sale) => {
    try {
      const res = await fetch(`${API_BASE}/sales`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(sale),
      });
      if (res.ok) {
        setToast({ type: 'success', message: 'Sale recorded' });
        fetchSales();
        return { success: true };
      } else {
        const data = await res.json();
        const errorMessage = data.message || res.statusText;
        setToast({ type: 'error', message: errorMessage });
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error' });
      return { success: false, error: err.message };
    }
  };

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
    } else if (location.pathname === '/media') {
      setActiveMenu('media');
    } else {
      setActiveMenu('dashboard');
    }
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <header className="logout-header">
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </header>
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
          <button className={activeMenu === 'dashboard' ? 'menu-btn active' : 'menu-btn'} onClick={() => { setActiveMenu('dashboard'); navigate('/'); }}>
            Dashboard
          </button>
          <button className={activeMenu === 'languages' ? 'menu-btn active' : 'menu-btn'} onClick={() => { setActiveMenu('languages'); navigate('/language'); }}>
            Language Master
          </button>
          <button className={activeMenu === 'categories' ? 'menu-btn active' : 'menu-btn'} onClick={() => { setActiveMenu('categories'); navigate('/category'); }}>
            Category Master
          </button>
          <button className={activeMenu === 'items' ? 'menu-btn active' : 'menu-btn'} onClick={() => { setActiveMenu('items'); navigate('/items'); }}>
            Items Master
          </button>
          <button className={activeMenu === 'purchase' ? 'menu-btn active' : 'menu-btn'} onClick={() => { setActiveMenu('purchase'); navigate('/purchase'); }}>
            Purchase Master
          </button>
          <button className={activeMenu === 'sales' ? 'menu-btn active' : 'menu-btn'} onClick={() => { setActiveMenu('sales'); navigate('/sales'); }}>
            Sales Master
          </button>
          <button className={activeMenu === 'report' ? 'menu-btn active' : 'menu-btn'} onClick={() => { setActiveMenu('report'); navigate('/report'); }}>
            Report Master
          </button>
          {!HIDE_MEDIA && (
            <button className={activeMenu === 'media' ? 'menu-btn active' : 'menu-btn'} onClick={() => setActiveMenu('media')}>
              Media Items
            </button>
          )}
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>{activeMenu === 'dashboard' ? 'Main Dashboard' : activeMenu === 'languages' ? 'Language Master' : activeMenu === 'categories' ? 'Category Master' : 'Media Items'}</h1>
            {activeMenu === 'categories' && <span className="page-badge">category_master</span>}
            <p>Organize your library with a modern control panel.</p>
          </div>
        </header>

        <Routes>
          <Route path="/language" element={<LanguageMaster languages={languages} onAddLanguage={handleAddLanguage} onUpdateLanguage={handleUpdateLanguage} onDeleteLanguage={handleDeleteLanguage} />} />
          <Route path="/category" element={<CategoryMaster categories={categories} onAddCategory={handleAddCategory} onUpdateCategory={handleUpdateCategory} onDeleteCategory={handleDeleteCategory} />} />
          <Route path="/items" element={<ItemsMaster categories={categories} languages={languages} onAddItem={handleAddItem} onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem} items={items} />} />
          <Route path="/purchase" element={<PurchaseMaster items={items} purchases={purchases} onAddPurchase={handleAddPurchase} authHeaders={authHeaders} />} />
          <Route path="/sales" element={<SalesMaster items={items} sales={sales} onAddSale={handleAddSale} />} />
          <Route path="/report" element={<ReportMaster reports={reports} authHeaders={authHeaders} />} />
          <Route path="/" element={activeMenu === 'dashboard' ? (
            <section className="dashboard-grid">
              <article className="stats-card blue">
                <h3>Languages</h3>
                <strong>{languages.length}</strong>
                <span>Configured languages</span>
              </article>
              <article className="stats-card green">
                <h3>Categories</h3>
                <strong>{categories.length}</strong>
                <span>Content categories</span>
              </article>
              {!HIDE_MEDIA && (
                <article className="stats-card purple">
                  <h3>Media Items</h3>
                  <strong>{items.length}</strong>
                  <span>Books, audio and video</span>
                </article>
              )}
            </section>
          ) : null} />
        </Routes>

        {!HIDE_MEDIA && activeMenu === 'media' && (
          <>
            <section className="card">
              <h3>Add new media item</h3>
              <form onSubmit={handleItemSubmit}>
                <input
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
                {formErrors.title && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{formErrors.title}</div>}
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="book">Book</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                </select>
                <input
                  placeholder="Author / Creator"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  required
                />
                {formErrors.author && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{formErrors.author}</div>}
                <textarea
                  placeholder="Short description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
                {formErrors.description && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{formErrors.description}</div>}
                <button type="submit">Save item</button>
              </form>
            </section>

            <section className="grid">
              {items.map((item) => (
                <article className="item-card" key={item.id}>
                  <span className={`badge ${item.type}`}>{item.type}</span>
                  <h3>{item.title}</h3>
                  <p>{item.author}</p>
                  <small>{item.description}</small>
                </article>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
