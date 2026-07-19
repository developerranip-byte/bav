import { useState, useEffect } from 'react';
import { API_BASE, createAuthHeaders } from '../utils/api';
import { CURRENCY_SYMBOL } from '../utils/config';

function ReportMaster({ setToast }) {
  const [reportsData, setReportsData] = useState({ data: [], page: 1, totalPages: 1 });
  const [history, setHistory] = useState({ type: null, itemId: null, rows: [], page: 1, totalPages: 1 });
  const [categories, setCategories] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [filters, setFilters] = useState({ search: '', categoryId: '', languageId: '' });
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

  const token = localStorage.getItem('bav_auth_token');
  const headers = () => createAuthHeaders(token);

  const fetchReports = async (page = 1) => {
    try {
      const queryParams = new URLSearchParams({ page });
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.categoryId) queryParams.append('categoryId', filters.categoryId);
      if (filters.languageId) queryParams.append('languageId', filters.languageId);
      if (sortConfig.key) {
        queryParams.append('sortBy', sortConfig.key);
        queryParams.append('sortOrder', sortConfig.direction);
      }

      const res = await fetch(`${API_BASE}/reports?${queryParams.toString()}`, { headers: headers() });
      if (res.ok) {
        setReportsData(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    }
  };

  useEffect(() => {
    fetchReports(reportsData.page);
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

  const fetchFiltersData = async () => {
    try {
      const [catRes, langRes] = await Promise.all([
        fetch(`${API_BASE}/categories`, { headers: headers() }),
        fetch(`${API_BASE}/languages`, { headers: headers() }),
      ]);
      if (catRes.ok) setCategories(await catRes.json());
      if (langRes.ok) setLanguages(await langRes.json());
    } catch (err) {
      console.error('Failed to fetch filters data:', err);
    }
  };

  useEffect(() => {
    fetchFiltersData();
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
          <h2>Report Master</h2>
        </div>
        <p>View item stock, last purchase/sale details, and history.</p>
      </div>

      <section className="content-grid">
        <div className="card">
          <h3>Item Report</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label className="field-label">Search (Name)</label>
              <input placeholder="Search item name..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="field-label">Category</label>
              <select value={filters.categoryId} onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}>
                <option value="">All Categories</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="field-label">Language</label>
              <select value={filters.languageId} onChange={(e) => setFilters({ ...filters, languageId: e.target.value })}>
                <option value="">All Languages</option>
                {languages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => fetchReports(1)} style={{ padding: '10px 16px' }}>Filter</button>
              <button onClick={() => { setFilters({ search: '', categoryId: '', languageId: '' }); setTimeout(() => fetchReports(1), 0); }} style={{ padding: '10px 16px', background: '#64748b' }}>Clear</button>
            </div>
          </div>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Item{renderSortIcon('name')}</th>
                <th onClick={() => handleSort('categoryName')} style={{ cursor: 'pointer' }}>Category{renderSortIcon('categoryName')}</th>
                <th onClick={() => handleSort('languageName')} style={{ cursor: 'pointer' }}>Language{renderSortIcon('languageName')}</th>
                <th onClick={() => handleSort('totalPurchased')} style={{ cursor: 'pointer' }}>Total Stock{renderSortIcon('totalPurchased')}</th>
                <th onClick={() => handleSort('totalSold')} style={{ cursor: 'pointer' }}>Total Sold{renderSortIcon('totalSold')}</th>
                <th onClick={() => handleSort('currentQuantity')} style={{ cursor: 'pointer' }}>Current Qty{renderSortIcon('currentQuantity')}</th>
                <th onClick={() => handleSort('lastPurchaseDate')} style={{ cursor: 'pointer' }}>Last Stock In{renderSortIcon('lastPurchaseDate')}</th>
                <th onClick={() => handleSort('lastSalesDate')} style={{ cursor: 'pointer' }}>Last Sale{renderSortIcon('lastSalesDate')}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reportsData.data.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.categoryName || '-'}</td>
                  <td>{item.languageName || '-'}</td>
                  <td>{item.totalPurchased}</td>
                  <td>{item.totalSold}</td>
                  <td>{item.currentQuantity}</td>
                  <td>{item.lastPurchaseDate ? new Date(item.lastPurchaseDate).toLocaleDateString() : '-'}</td>
                  <td>{item.lastSalesDate ? new Date(item.lastSalesDate).toLocaleDateString() : '-'}</td>
                  <td>
                    <button onClick={() => handleHistory(item.id, 'purchase')} style={{ marginRight: 8 }}>
                      Stock History
                    </button>
                    <button onClick={() => handleHistory(item.id, 'sales')}>
                      Sales History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button
              disabled={reportsData.page <= 1}
              onClick={() => fetchReports(reportsData.page - 1)}
            >
              Previous
            </button>
            <span>Page {reportsData.page} of {reportsData.totalPages}</span>
            <button
              disabled={reportsData.page >= reportsData.totalPages}
              onClick={() => fetchReports(reportsData.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 20 }}>
        <div className="card">
          <h3>{history.type === 'purchase' ? 'Stock History' : history.type === 'sales' ? 'Sales History' : 'History'}</h3>
          {history.type ? (
            <>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Quantity</th>
                    {history.type !== 'purchase' && <th>Total Amount</th>}
                    <th>Added By</th>
                  </tr>
                </thead>
                <tbody>
                  {history.rows.map((row) => (
                    <tr key={row.id}>
                      <td>{new Date(history.type === 'purchase' ? row.purchaseDate : row.salesDate).toLocaleDateString()}</td>
                      <td>{row.quantity}</td>
                      {history.type !== 'purchase' && (
                        <td>
                          {CURRENCY_SYMBOL}
                          {Number(row.totalAmount).toFixed(2)}
                        </td>
                      )}
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
