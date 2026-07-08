import { useState, useMemo } from 'react';

function SalesMaster({ items, sales, onAddSale }) {
  const [saleForm, setSaleForm] = useState({
    itemId: items[0]?.id || '',
    quantity: 1,
    salesDate: new Date().toISOString().slice(0, 10),
  });
  const [errors, setErrors] = useState({});

  const itemOptions = useMemo(() => items, [items]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!saleForm.itemId) nextErrors.itemId = 'Select an item';
    if (!saleForm.quantity || Number(saleForm.quantity) <= 0) nextErrors.quantity = 'Quantity must be at least 1';
    if (!saleForm.salesDate) nextErrors.salesDate = 'Sales date is required';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    const result = await onAddSale({
      itemId: saleForm.itemId,
      quantity: Number(saleForm.quantity),
      salesDate: saleForm.salesDate,
    });
    if (result && result.success) {
      setSaleForm({
        itemId: items[0]?.id || '',
        quantity: 1,
        salesDate: new Date().toISOString().slice(0, 10),
      });
    } else if (result && result.error) {
      setErrors({ quantity: result.error });
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

            <button type="submit">Save Sale</button>
          </form>
        </div>

        <div className="card">
          <h3>Sales History</h3>
          <ul className="list">
            {sales.map((sale) => (
              <li key={sale.id}>
                <div className="list-row">
                  <strong>{findItemName(sale.itemId)}</strong>
                  <span>{new Date(sale.salesDate).toLocaleDateString()}</span>
                </div>
                <p>Qty: {sale.quantity}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </section>
  );
}

export default SalesMaster;
