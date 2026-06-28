import { useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import CategoryMaster from './components/CategoryMaster';
import ItemsMaster from './components/ItemsMaster';
import LanguageMaster from './components/LanguageMaster';

const API_BASE = 'http://localhost:5000/api';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [items, setItems] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '',
    type: 'book',
    author: '',
    description: '',
  });

  const fetchCategories = async () => {
    const res = await fetch(`${API_BASE}/categories`);
    if (res.ok) setCategories(await res.json());
  };

  const fetchLanguages = async () => {
    const res = await fetch(`${API_BASE}/languages`);
    if (res.ok) setLanguages(await res.json());
  };

  const fetchItems = async () => {
    const res = await fetch(`${API_BASE}/items`);
    if (res.ok) setItems(await res.json());
  };

  useEffect(() => {
    fetchCategories();
    fetchLanguages();
    fetchItems();
  }, []);

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ title: '', type: 'book', author: '', description: '' });
    fetchItems();
  };

  const handleAddCategory = async (category) => {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    if (res.ok) fetchCategories();
  };

  const handleAddLanguage = async (language) => {
    const res = await fetch(`${API_BASE}/languages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(language),
    });
    if (res.ok) fetchLanguages();
  };

  const handleAddItem = async (item) => {
    const res = await fetch(`${API_BASE}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (res.ok) fetchItems();
  };

  useEffect(() => {
    if (location.pathname === '/language') {
      setActiveMenu('languages');
    } else if (location.pathname === '/category') {
      setActiveMenu('categories');
    } else if (location.pathname === '/items') {
      setActiveMenu('items');
    } else if (location.pathname === '/media') {
      setActiveMenu('media');
    } else {
      setActiveMenu('dashboard');
    }
  }, [location.pathname]);

  return (
    <div className="app-shell">
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
          <button className={activeMenu === 'media' ? 'menu-btn active' : 'menu-btn'} onClick={() => setActiveMenu('media')}>
            Media Items
          </button>
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
          <Route path="/language" element={<LanguageMaster languages={languages} onAddLanguage={handleAddLanguage} />} />
          <Route path="/category" element={<CategoryMaster categories={categories} onAddCategory={handleAddCategory} />} />
          <Route path="/items" element={<ItemsMaster categories={categories} languages={languages} onAddItem={handleAddItem} items={items} />} />
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
              <article className="stats-card purple">
                <h3>Media Items</h3>
                <strong>{items.length}</strong>
                <span>Books, audio and video</span>
              </article>
            </section>
          ) : null} />
        </Routes>

        {activeMenu === 'media' && (
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
                <textarea
                  placeholder="Short description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
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
