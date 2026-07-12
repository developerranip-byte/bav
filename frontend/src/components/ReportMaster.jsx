import { useState, useEffect } from 'react';
import { API_BASE, createAuthHeaders } from '../utils/api';
import { CURRENCY_SYMBOL } from '../utils/config';

function ReportMaster({ setToast }) {
  const [reports, setReports] = useState([]);
  const [history, setHistory] = useState({ type: null, itemId: null, rows: [], page: 1, totalPages: 1 });

  const token = localStorage.getItem('bav_auth_token');
  const headers = () => createAuthHeaders(token);

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/reports`, { headers: headers() });
      if (res.ok) {
        setReports(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleHistory = async (itemId, type, page = 1) => {
    const endpoint = type === 'purchase' ? 'purchases' : 'sales';
    try {
      const res = await fetch(`${API_BASE}/reports/${itemId}/${endpoint}?page=${page}`, {
        headers: headers(),
      });
      if (res.ok) {
        const data = await res.json();
        setHistory({
          type,
          itemId,
          rows: data.rows,
          page: data.page,
          totalPages: data.totalPages,
        });
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  return (
    <section className="page-card">
      <div className="page-header">
        <div>
          <h2>Item Report</h2>
          <span className="page-badge">report_master</span>
        </div>
        <p>View item stock, last purchase/sale details, and history.</p>
      </div>

      <section className="content-grid">
        <div className="card">
          <h3>Item Report</h3>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Language</th>
                <th>Opening Qty</th>
                <th>Total Purchase</th>
                <th>Total Sold</th>
                <th>Current Qty</th>
                <th>Last Purchase</th>
                <th>Last Sale</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.categoryName || '-'}</td>
                  <td>{item.languageName || '-'}</td>
                  <td>{item.openingQty}</td>
                  <td>{item.totalPurchased}</td>
                  <td>{item.totalSold}</td>
                  <td>{item.currentQuantity}</td>
                  <td>{item.lastPurchaseDate ? new Date(item.lastPurchaseDate).toLocaleDateString() : '-'}</td>
                  <td>{item.lastSalesDate ? new Date(item.lastSalesDate).toLocaleDateString() : '-'}</td>
                  <td>
                    <button onClick={() => handleHistory(item.id, 'purchase')} style={{ marginRight: 8 }}>
                      Purchase History
                    </button>
                    <button onClick={() => handleHistory(item.id, 'sales')}>
                      Sales History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 20 }}>
        <div className="card">
          <h3>{history.type === 'purchase' ? 'Purchase History' : history.type === 'sales' ? 'Sales History' : 'History'}</h3>
          {history.type ? (
            <>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Quantity</th>
                    <th>Total Amount</th>
                    <th>Added By</th>
                  </tr>
                </thead>
                <tbody>
                  {history.rows.map((row) => (
                    <tr key={row.id}>
                      <td>{new Date(history.type === 'purchase' ? row.purchaseDate : row.salesDate).toLocaleDateString()}</td>
                      <td>{row.quantity}</td>
                      <td>
                        {CURRENCY_SYMBOL}
                        {Number(row.totalAmount).toFixed(2)}
                      </td>
                      <td>{row.addedBy || 'System'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <button
                  disabled={history.page <= 1}
                  onClick={() => handleHistory(history.itemId, history.type, history.page - 1)}
                >
                  Previous
                </button>
                <span>Page {history.page} of {history.totalPages}</span>
                <button
                  disabled={history.page >= history.totalPages}
                  onClick={() => handleHistory(history.itemId, history.type, history.page + 1)}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <p>Select a report button to load history.</p>
          )}
        </div>
      </section>
    </section>
  );
}

export default ReportMaster;
