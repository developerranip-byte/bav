import { useEffect, useMemo, useState } from 'react';
import { API_BASE, createAuthHeaders } from '../utils/api';

function PurchaseMaster({ setToast }) {
  const [items, setItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [purchaseForm, setPurchaseForm] = useState({
    itemId: '',
    quantity: 1,
    amount: 0,
    purchaseDate: new Date().toISOString().slice(0, 10),
  });
  const [itemSearch, setItemSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [errors, setErrors] = useState({});

  const token = localStorage.getItem('bav_auth_token');
  const headers = () => createAuthHeaders(token);

  const activeItems = useMemo(() => items.filter((item) => item.isActive), [items]);

  const fetchData = async () => {
    try {
      const [itemRes, purchaseRes] = await Promise.all([
        fetch(`${API_BASE}/items`, { headers: headers() }),
        fetch(`${API_BASE}/purchases`, { headers: headers() }),
      ]);

      if (itemRes.ok) {
        const itemsData = await itemRes.json();
        setItems(itemsData);
        setPurchaseForm((prev) => ({ ...prev, itemId: itemsData[0]?.id || '' }));
      }
      if (purchaseRes.ok) setPurchases(await purchaseRes.json());
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
          quantity: 1,
          amount: 0,
          purchaseDate: new Date().toISOString().slice(0, 10),
        });
        setItemSearch('');
        setSuggestions([]);
        fetchData();
      } else {
        const error = await res.json();
        setToast({ type: 'error', message: error.message || res.statusText });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error' });
    }
  };

  const findItemName = (itemId) => items.find((item) => item.id === Number(itemId))?.name || '-';

  return (
    <section className="page-card">
      <div className="page-header">
        <div>
          <h2>Purchase Master</h2>
          <span className="page-badge">purchase_master</span>
        </div>
        <p>Record purchase transactions for items.</p>
      </div>

      <section className="content-grid">
        <div className="card">
          <h3>Add Purchase</h3>
          <form onSubmit={handleSubmit}>
            <label className="field-label">Search item by name or ISBN</label>
            <input
              placeholder="Type item name or ISBN"
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
            />
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

            <label className="field-label">Purchase Quantity</label>
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

            <label className="field-label">Purchase Date</label>
            <input
              type="date"
              value={purchaseForm.purchaseDate}
              onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseDate: e.target.value })}
            />
            {errors.purchaseDate && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{errors.purchaseDate}</div>}

            <button type="submit">Save Purchase</button>
          </form>
        </div>

        <div className="card">
          <h3>Purchase History</h3>
          <ul className="list">
            {purchases.map((purchase) => (
              <li key={purchase.id}>
                <div className="list-row">
                  <strong>{findItemName(purchase.itemId)}</strong>
                  <span>{new Date(purchase.purchaseDate).toLocaleDateString()}</span>
                </div>
                <p>Qty: {purchase.quantity}</p>
                <p>Amount: {purchase.amount}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </section>
  );
}

export default PurchaseMaster;
