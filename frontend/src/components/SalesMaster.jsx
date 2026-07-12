import { useState, useMemo, useEffect } from 'react';
import { API_BASE, createAuthHeaders } from '../utils/api';
import { CURRENCY_SYMBOL } from '../utils/config';

function SalesMaster({ setToast }) {
  const [items, setItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [saleForm, setSaleForm] = useState({
    itemId: '',
    quantity: 1,
    salesDate: new Date().toISOString().slice(0, 10),
    salesPrice: 0,
  });
  const [errors, setErrors] = useState({});

  const token = localStorage.getItem('bav_auth_token');
  const headers = () => createAuthHeaders(token);

  const itemOptions = useMemo(() => items, [items]);

  const fetchData = async () => {
    try {
      const [itemRes, salesRes] = await Promise.all([
        fetch(`${API_BASE}/items`, { headers: headers() }),
        fetch(`${API_BASE}/sales`, { headers: headers() }),
      ]);

      if (itemRes.ok) {
        const itemsData = await itemRes.json();
        setItems(itemsData);
        setSaleForm((prev) => ({ ...prev, itemId: itemsData[0]?.id || '' }));
      }
      if (salesRes.ok) setSales(await salesRes.json());
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Automatically calculate salesPrice based on selected item's last purchase price and quantity
  useEffect(() => {
    const selectedItem = items.find((item) => item.id === Number(saleForm.itemId));
    const purchasePrice = selectedItem?.lastPurchasePrice || 0;
    const calculatedPrice = Number((purchasePrice * (saleForm.quantity || 0)).toFixed(2));
    setSaleForm((prev) => ({ ...prev, salesPrice: calculatedPrice }));
  }, [saleForm.itemId, saleForm.quantity, items]);

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
        fetchData();
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

  const findItemName = (id) => items.find((item) => item.id === Number(id))?.name || '-';

  return (
    <section className="page-card">
      <div className="page-header">
        <div>
          <h2>Sales Master</h2>
          <span className="page-badge">sales_master</span>
        </div>
        <p>Record customer sales and validate stock availability.</p>
      </div>

      <section className="content-grid">
        <div className="card">
          <h3>Add Sale</h3>
          <form onSubmit={handleSubmit}>
            <label className="field-label">Item</label>
            <select
              value={saleForm.itemId}
              onChange={(e) => setSaleForm({ ...saleForm, itemId: Number(e.target.value) })}
            >
              <option value="">Select item</option>
              {itemOptions.filter((item) => item.isActive).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {errors.itemId && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{errors.itemId}</div>}

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
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Total Amount</th>
                <th>Date</th>
                <th>Added By</th>
              </tr>
            </thead>
            <tbody>
              {sales.length > 0 ? (
                sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{findItemName(sale.itemId)}</td>
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
        </div>
      </section>
    </section>
  );
}

export default SalesMaster;
