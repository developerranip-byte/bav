import { useState, useMemo, useEffect } from 'react';
import { API_BASE, createAuthHeaders } from '../utils/api';
import { CURRENCY_SYMBOL } from '../utils/config';

function SalesMaster({ setToast }) {
  const [items, setItems] = useState([]);
  const [salesData, setSalesData] = useState({ data: [], page: 1, totalPages: 1 });
  const [itemSearch, setItemSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [filters, setFilters] = useState({ itemId: '', startDate: '', endDate: '' });
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [saleForm, setSaleForm] = useState({
    itemId: '',
    quantity: 1,
    salesDate: new Date().toISOString().slice(0, 10),
    salesPrice: 0,
  });
  const [errors, setErrors] = useState({});

  const token = localStorage.getItem('bav_auth_token');
  const headers = () => createAuthHeaders(token);

  const activeItems = useMemo(() => (items.data || items).filter((item) => item.isActive), [items]);

  const fetchData = async () => {
    try {
      const [itemRes, salesRes] = await Promise.all([
        fetch(`${API_BASE}/items`, { headers: headers() }),
        fetch(`${API_BASE}/sales`, { headers: headers() }),
      ]);

      if (itemRes.ok) {
        const itemsData = await itemRes.json();
        setItems(itemsData);
        setSaleForm((prev) => ({ ...prev, itemId: itemsData.data?.[0]?.id || '' }));
      }
      if (salesRes.ok) setSalesData(await salesRes.json());
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchSales = async (page = 1) => {
    try {
      const queryParams = new URLSearchParams({ page });
      if (filters.itemId) queryParams.append('itemId', filters.itemId);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (sortConfig.key) {
        queryParams.append('sortBy', sortConfig.key);
        queryParams.append('sortOrder', sortConfig.direction);
      }

      const res = await fetch(`${API_BASE}/sales?${queryParams.toString()}`, { headers: headers() });
      if (res.ok) setSalesData(await res.json());
    } catch (err) {
      console.error('Failed to fetch sales:', err);
    }
  };

  useEffect(() => {
    fetchSales(salesData.page);
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
          setSuggestions([]);
        }
      } catch (err) {
        if (err.name !== 'AbortError') setSuggestions([]);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [itemSearch]);

  // Automatically calculate salesPrice based on selected item's last purchase price and quantity
  useEffect(() => {
    const itemsArray = items.data || items;
    const selectedItem = itemsArray.find((item) => item.id === Number(saleForm.itemId)) || suggestions.find(s => s.id === Number(saleForm.itemId));
    const purchasePrice = selectedItem?.lastPurchasePrice || 0;
    const calculatedPrice = Number((purchasePrice * (saleForm.quantity || 0)).toFixed(2));
    setSaleForm((prev) => ({ ...prev, salesPrice: calculatedPrice }));
  }, [saleForm.itemId, saleForm.quantity, items, suggestions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!saleForm.itemId) nextErrors.itemId = 'Select an item';
    if (!saleForm.quantity || Number(saleForm.quantity) <= 0) nextErrors.quantity = 'Quantity must be at least 1';
    if (!saleForm.salesDate) nextErrors.salesDate = 'Sales date is required';
    if (!saleForm.salesPrice || Number(saleForm.salesPrice) < 0) nextErrors.salesPrice = 'Sales price must be a non-negative number';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    try {
      const res = await fetch(`${API_BASE}/sales`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          itemId: saleForm.itemId,
          quantity: Number(saleForm.quantity),
          salesDate: saleForm.salesDate,
          salesPrice: Number(saleForm.salesPrice),

        }),
      });

      if (res.ok) {
        setToast({ type: 'success', message: 'Sale recorded' });
        setSaleForm({
          itemId: items[0]?.id || '',
          quantity: 1,
          salesDate: new Date().toISOString().slice(0, 10),
          salesPrice: 0,
        });
        setItemSearch('');
        setSuggestions([]);
        fetchSales(1);
      } else {
        const data = await res.json();
        const errorMessage = data.message || res.statusText;
        setToast({ type: 'error', message: errorMessage });
        setErrors({ quantity: errorMessage });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error' });
    }
  };
  const handleExport = async () => {
    try {
      const res = await fetch(`${API_BASE}/sales/export`, { headers: headers() });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'SalesMaster.xlsx';
        a.click();
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
      const res = await fetch(`${API_BASE}/sales/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('bav_auth_token')}`,
        },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setToast({ type: 'success', message: data.message });
        fetchSales(1);
      } else {
        const data = await res.json();
        setToast({ type: 'error', message: data.error ? `${data.message}: ${data.error}` : (data.message || 'Import failed') });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Network error' });
    }
    e.target.value = null; // reset input
  };

  return (
    <section className="page-card">
      <div className="page-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <h2>Sales Master</h2>
          <span className="page-badge">sales_master</span>
          <p style={{ marginTop: 8 }}>Record customer sales and validate stock availability.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {localStorage.getItem('bav_user_type') === 'super_admin' && (
            <label style={{ cursor: 'pointer', background: '#3b82f6', color: 'white', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', border: 'none', display: 'inline-block' }}>
              Import Excel
              <input
                type="file"
                accept=".xlsx, .xls"
                style={{ display: 'none' }}
                onChange={handleImport}
              />
            </label>
          )}
          <button onClick={handleExport} style={{ background: '#16a34a' }}>
            Export Excel
          </button>
        </div>
      </div>

      <section className="content-grid">
        <div className="card">
          <h3>Add Sale</h3>
          <form onSubmit={handleSubmit}>
            <label className="field-label">Search item by name or ISBN</label>
            <input
              placeholder="Type item name or ISBN"
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
            />
            <select
              value={saleForm.itemId}
              onChange={(e) => setSaleForm({ ...saleForm, itemId: Number(e.target.value) })}
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
                      setSaleForm({ ...saleForm, itemId: item.id });
                      setItemSearch(item.name || item.isbn || '');
                    }}
                  >
                    {item.name} {item.isbn ? `(${item.isbn})` : ''}
                  </div>
                ))}
              </div>
            )}

            <label className="field-label">Sales Quantity</label>
            <input
              type="number"
              min="1"
              value={saleForm.quantity}
              onChange={(e) => setSaleForm({ ...saleForm, quantity: Number(e.target.value) })}
            />
            {errors.quantity && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{errors.quantity}</div>}

            <label className="field-label">Sales Date</label>
            <input
              type="date"
              value={saleForm.salesDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSaleForm({ ...saleForm, salesDate: e.target.value })}
            />
            {errors.salesDate && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{errors.salesDate}</div>}

            <label className="field-label">Sales Price (Auto-calculated)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={saleForm.salesPrice}
              readOnly
              style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
            />
            {errors.salesPrice && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{errors.salesPrice}</div>}

            <button type="submit">Save Sale</button>
          </form>
        </div>

        <div className="card">
          <h3>Sales History</h3>
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
              <label className="field-label">Start Date</label>
              <input type="date" value={filters.startDate} max={new Date().toISOString().split('T')[0]} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="field-label">End Date</label>
              <input type="date" value={filters.endDate} max={new Date().toISOString().split('T')[0]} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => fetchSales(1)} style={{ padding: '10px 16px' }}>Filter</button>
              <button onClick={() => { setFilters({ itemId: '', startDate: '', endDate: '' }); setTimeout(() => fetchSales(1), 0); }} style={{ padding: '10px 16px', background: '#64748b' }}>Clear</button>
            </div>
          </div>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th onClick={() => handleSort('itemName')} style={{ cursor: 'pointer' }}>Item{renderSortIcon('itemName')}</th>
                <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>Quantity{renderSortIcon('quantity')}</th>
                <th onClick={() => handleSort('salesPrice')} style={{ cursor: 'pointer' }}>Total Amount{renderSortIcon('salesPrice')}</th>
                <th onClick={() => handleSort('salesDate')} style={{ cursor: 'pointer' }}>Date{renderSortIcon('salesDate')}</th>
                <th onClick={() => handleSort('addedBy')} style={{ cursor: 'pointer' }}>Added By{renderSortIcon('addedBy')}</th>
              </tr>
            </thead>
            <tbody>
              {salesData.data.length > 0 ? (
                salesData.data.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.itemName || '-'}</td>
                    <td>{sale.quantity}</td>
                    <td>{CURRENCY_SYMBOL}{Number(sale?.totalAmount).toFixed(2)}</td>
                    <td>{new Date(sale.salesDate).toLocaleDateString()}</td>
                    <td>{sale.addedBy || 'System'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>
                    No sales recorded
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button
              disabled={salesData.page <= 1}
              onClick={() => fetchSales(salesData.page - 1)}
            >
              Previous
            </button>
            <span>Page {salesData.page} of {salesData.totalPages}</span>
            <button
              disabled={salesData.page >= salesData.totalPages}
              onClick={() => fetchSales(salesData.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}

export default SalesMaster;
