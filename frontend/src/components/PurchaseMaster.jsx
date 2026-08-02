import { useEffect, useMemo, useState } from 'react';
import { API_BASE, createAuthHeaders } from '../utils/api';
import Loader from './Loader';
import BarcodeScanner from './BarcodeScanner';
import { CURRENCY_SYMBOL } from '../utils/config';

function PurchaseMaster({ setToast }) {
  const [items, setItems] = useState([]);
  const [centers, setCenters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasesData, setPurchasesData] = useState({ data: [], page: 1, totalPages: 1 });
  const [purchaseForm, setPurchaseForm] = useState({
    itemId: '',
    centerId: '',
    quantity: 1,
    amount: 0,
    purchaseDate: new Date().toISOString().slice(0, 10),
  });
  const [itemSearch, setItemSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [filters, setFilters] = useState({ itemId: '', centerId: '', startDate: '', endDate: '' });
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [errors, setErrors] = useState({});

  const token = localStorage.getItem('bav_auth_token');
  const headers = () => createAuthHeaders(token);

  const activeItems = useMemo(() => (items.data || items).filter((item) => item.isActive), [items]);

  const userCenters = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('bav_user_centers') || '[]');
    } catch {
      return [];
    }
  }, []);
  const userType = localStorage.getItem('bav_user_type');
  const availableCenters = useMemo(() => {
    if (userType === 'super_admin') return centers;
    return centers.filter(c => userCenters.includes(c.id));
  }, [centers, userCenters, userType]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [itemRes, purchaseRes, centerRes] = await Promise.all([
        fetch(`${API_BASE}/items`, { headers: headers() }),
        fetch(`${API_BASE}/purchases`, { headers: headers() }),
        fetch(`${API_BASE}/centers`, { headers: headers() }),
      ]);

      if (itemRes.ok) {
        const itemsData = await itemRes.json();
        setItems(itemsData);
        setPurchaseForm((prev) => ({ ...prev, itemId: itemsData.data?.[0]?.id || '' }));
      }
      if (centerRes.ok) {
        const centersData = await centerRes.json();
        setCenters(centersData);
        if (centersData.length > 0) {
          const uCenters = JSON.parse(localStorage.getItem('bav_user_centers') || '[]');
          const uType = localStorage.getItem('bav_user_type');
          const avail = uType === 'super_admin' ? centersData : centersData.filter(c => uCenters.includes(c.id));
          if (avail.length > 0) {
            setPurchaseForm((prev) => ({ ...prev, centerId: avail[0].id }));
          }
        }
      }
      if (purchaseRes.ok) setPurchasesData(await purchaseRes.json());
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchPurchases = async (page = 1) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({ page });
      if (filters.itemId) queryParams.append('itemId', filters.itemId);
      if (filters.centerId) queryParams.append('centerId', filters.centerId);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (sortConfig.key) {
        queryParams.append('sortBy', sortConfig.key);
        queryParams.append('sortOrder', sortConfig.direction);
      }

      const res = await fetch(`${API_BASE}/purchases?${queryParams.toString()}`, { headers: headers() });
      if (res.ok) setPurchasesData(await res.json());
    } catch (err) {
      console.error('Failed to fetch purchases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases(purchasesData.page);
  }, [sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  useEffect(() => {
    const query = itemSearch.trim();
    if (!query) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/items/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
          headers: headers(),
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data : []);
        } else {
          console.error('Search failed:', res.status, res.statusText);
          setSuggestions([]);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Search error:', err);
          setSuggestions([]);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [itemSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!purchaseForm.itemId) nextErrors.itemId = 'Select an item';
    if (!purchaseForm.centerId) nextErrors.centerId = 'Select a center';
    if (!purchaseForm.quantity || purchaseForm.quantity <= 0) nextErrors.quantity = 'Quantity must be greater than 0';
    if (!purchaseForm.amount || purchaseForm.amount <= 0) nextErrors.amount = 'Amount must be greater than 0';
    if (!purchaseForm.purchaseDate) nextErrors.purchaseDate = 'Purchase date is required';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    try {
      const res = await fetch(`${API_BASE}/purchases`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(purchaseForm),
      });

      if (res.ok) {
        setToast({ type: 'success', message: 'Purchase recorded' });
        setPurchaseForm({
          itemId: items[0]?.id || '',
          centerId: availableCenters[0]?.id || '',
          quantity: 1,
          amount: 0,
          purchaseDate: new Date().toISOString().slice(0, 10),
        });
        setItemSearch('');
        setSuggestions([]);
        fetchPurchases(1);
      } else {
        const error = await res.json();
        setToast({ type: 'error', message: error.message || res.statusText });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error' });
    }
  };



  const handleExport = async () => {
    try {
      const res = await fetch(`${API_BASE}/purchases/export`, { headers: headers() });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'StockMaster.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        setToast({ type: 'error', message: 'Failed to export' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Network error' });
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/purchases/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', message: data.message });
        fetchPurchases(1);
      } else {
        setToast({ type: 'error', message: data.error ? `${data.message}: ${data.error}` : (data.message || 'Import failed') });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Network error' });
    }
    e.target.value = null;
  };

  return (
    <section className="page-card">
      <div className="page-header">
        <div>
          <h2>Stock Master</h2>
          <p style={{ marginTop: 8 }}>Record stock transactions for items.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {localStorage.getItem('bav_user_type') === 'super_admin' && (
            <>
              <input 
                type="file" 
                id="import-excel-stock" 
                accept=".xlsx, .xls" 
                style={{ display: 'none' }} 
                onChange={handleImport}
              />
              <label htmlFor="import-excel-stock" className="menu-btn" style={{ background: '#5C060E', color: 'white', textAlign: 'center', margin: 0 }}>
                Import Excel
              </label>
            </>
          )}
          <button onClick={handleExport}>
            Export Excel
          </button>
        </div>
      </div>

      <section className="content-grid">
        <div className="card">
          <h3>Add Stock</h3>
          <form onSubmit={handleSubmit}>
            <label className="field-label">Search item by name or ISBN</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                style={{ flex: 1, margin: 0 }}
                placeholder="Type item name or ISBN or Scan"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
              />
              <button 
                type="button" 
                className="auto-width-btn"
                onClick={() => setShowScanner(true)}
                style={{ background: '#2563eb', padding: '0 16px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, minHeight: '42px', width: 'auto' }}
                title="Scan Barcode"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><rect x="7" y="7" width="10" height="10" rx="1"></rect></svg>
              </button>
            </div>
            <select
              value={purchaseForm.itemId}
              onChange={(e) => setPurchaseForm({ ...purchaseForm, itemId: Number(e.target.value) })}
            >
              <option value="">Select item</option>
              {suggestions.length > 0 ? suggestions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} {item.isbn ? `(${item.isbn})` : ''}
                </option>
              )) : activeItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} {item.isbn ? `(${item.isbn})` : ''}
                </option>
              ))}
            </select>
            {errors.itemId && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{errors.itemId}</div>}

            {itemSearch.trim() && suggestions.length > 0 && (
              <div style={{ marginTop: 8, border: '1px solid #ddd', padding: 8, borderRadius: 4, maxHeight: 160, overflowY: 'auto' }}>
                {suggestions.map((item) => (
                  <div
                    key={item.id}
                    style={{ cursor: 'pointer', padding: '4px 0' }}
                    onClick={() => {
                      setPurchaseForm({ ...purchaseForm, itemId: item.id });
                      setItemSearch(item.name || item.isbn || '');
                    }}
                  >
                    {item.name} {item.isbn ? `(${item.isbn})` : ''}
                  </div>
                ))}
              </div>
            )}

            <label className="field-label">Center</label>
            <select
              value={purchaseForm.centerId}
              onChange={(e) => setPurchaseForm({ ...purchaseForm, centerId: Number(e.target.value) })}
            >
              <option value="">Select center</option>
              {availableCenters.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>
            {errors.centerId && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{errors.centerId}</div>}

            <label className="field-label">Stock Quantity</label>
            <input
              type="number"
              min="1"
              value={purchaseForm.quantity}
              onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: Number(e.target.value) })}
            />
            {errors.quantity && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{errors.quantity}</div>}

            <label className="field-label">Price</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={purchaseForm.amount}
              onChange={(e) => setPurchaseForm({ ...purchaseForm, amount: Number(e.target.value) })}
            />
            {errors.amount && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{errors.amount}</div>}

            <label className="field-label">Stock Date</label>
            <input
              type="date"
              value={purchaseForm.purchaseDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseDate: e.target.value })}
            />
            {errors.purchaseDate && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{errors.purchaseDate}</div>}

            <button type="submit">Save Stock</button>
          </form>
        </div>

        <div className="card">
          <h3>Stock History</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label className="field-label">Filter by Item</label>
              <select value={filters.itemId} onChange={(e) => setFilters({ ...filters, itemId: e.target.value })}>
                <option value="">All Items</option>
                {activeItems.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="field-label">Filter by Center</label>
              <select value={filters.centerId} onChange={(e) => setFilters({ ...filters, centerId: e.target.value })}>
                <option value="">All Centers</option>
                {availableCenters.map((center) => (
                  <option key={center.id} value={center.id}>{center.name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="field-label">Start Date</label>
              <input type="date" value={filters.startDate} max={new Date().toISOString().split('T')[0]} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="field-label">End Date</label>
              <input type="date" value={filters.endDate} max={new Date().toISOString().split('T')[0]} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => fetchPurchases(1)} style={{ padding: '10px 16px' }}>Filter</button>
              <button onClick={() => { setFilters({ itemId: '', centerId: '', startDate: '', endDate: '' }); setTimeout(() => fetchPurchases(1), 0); }} style={{ padding: '10px 16px', background: '#64748b' }}>Clear</button>
            </div>
          </div>
          <div className="loading-state">
            {isLoading && <Loader overlay />}
            <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th onClick={() => handleSort('itemName')} style={{ cursor: 'pointer' }}>Item{renderSortIcon('itemName')}</th>
                <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>Quantity{renderSortIcon('quantity')}</th>
                <th onClick={() => handleSort('amount')} style={{ cursor: 'pointer' }}>Price{renderSortIcon('amount')}</th>
                <th onClick={() => handleSort('centerName')} style={{ cursor: 'pointer' }}>Center{renderSortIcon('centerName')}</th>
                <th onClick={() => handleSort('purchaseDate')} style={{ cursor: 'pointer' }}>Date{renderSortIcon('purchaseDate')}</th>
                <th onClick={() => handleSort('addedBy')} style={{ cursor: 'pointer' }}>Added By{renderSortIcon('addedBy')}</th>
              </tr>
            </thead>
            <tbody>
              {purchasesData.data.length > 0 ? (
                purchasesData.data.map((purchase) => (
                  <tr key={purchase.id}>
                    <td>{purchase.itemName || '-'}</td>
                    <td>{purchase.quantity}</td>
                    <td>{CURRENCY_SYMBOL}{Number(purchase.amount).toFixed(2)}</td>
                    <td>{purchase.centerName || '-'}</td>
                    <td>{new Date(purchase.purchaseDate).toLocaleDateString()}</td>
                    <td>{purchase.addedBy || 'System'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>
                    No stock recorded
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button
              disabled={purchasesData.page <= 1}
              onClick={() => fetchPurchases(purchasesData.page - 1)}
            >
              Previous
            </button>
            <span>Page {purchasesData.page} of {purchasesData.totalPages}</span>
            <button
              disabled={purchasesData.page >= purchasesData.totalPages}
              onClick={() => fetchPurchases(purchasesData.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>
      
      {showScanner && (
        <BarcodeScanner 
          onScan={(isbn) => {
            setItemSearch(isbn);
            setShowScanner(false);
            setToast({ type: 'success', message: 'Barcode scanned successfully!' });
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </section>
  );
}

export default PurchaseMaster;
