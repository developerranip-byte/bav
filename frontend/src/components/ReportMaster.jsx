import { useState } from 'react';

function ReportMaster({ reports, authHeaders }) {
  const [history, setHistory] = useState({ type: null, itemId: null, rows: [], page: 1, totalPages: 1 });

  const handleHistory = async (itemId, type, page = 1) => {
    const endpoint = type === 'purchase' ? 'purchases' : 'sales';
    const res = await fetch(`http://localhost:5000/api/reports/${itemId}/${endpoint}?page=${page}`, {
      headers: authHeaders ? authHeaders() : undefined,
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
              <ul className="list">
                {history.rows.map((row) => (
                  <li key={row.id}>
                    <div className="list-row">
                      <strong>{history.type === 'purchase' ? `Purchased Qty ${row.quantity}` : `Sold Qty ${row.quantity}`}</strong>
                      <span>{new Date(history.type === 'purchase' ? row.purchaseDate : row.salesDate).toLocaleDateString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
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
