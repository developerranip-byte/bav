import { useEffect, useState } from 'react';
import { API_BASE, createAuthHeaders } from '../utils/api';
import { CURRENCY_SYMBOL } from '../utils/config';

function Dashboard({ authHeaders }) {
  const [stats, setStats] = useState({ languages: 0, categories: 0, items: 0 });
  const [todayStats, setTodayStats] = useState({ soldQty: 0, soldAmount: 0, purchasedQty: 0, purchasedAmount: 0 });
  const [weeklySales, setWeeklySales] = useState([]);
  const [weeklyPurchases, setWeeklyPurchases] = useState([]);

  const token = localStorage.getItem('bav_auth_token');
  const headers = () => createAuthHeaders(token);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/dashboard/stats`, { headers: headers() });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setTodayStats(data.todayStats);
          setWeeklySales(data.weeklySales);
          setWeeklyPurchases(data.weeklyPurchases);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      }
    };

    fetchStats();
  }, []);

  return (
    <>
      <section className="dashboard-grid">
        <article className="stats-card blue">
          <h3>Languages</h3>
          <strong>{stats.languages}</strong>
          <span>Configured languages</span>
        </article>
        <article className="stats-card green">
          <h3>Categories</h3>
          <strong>{stats.categories}</strong>
          <span>Content categories</span>
        </article>
        <article className="stats-card purple">
          <h3>Items</h3>
          <strong>{stats.items}</strong>
          <span>Total items</span>
        </article>
      </section>

      <section className="dashboard-grid" style={{ marginTop: 20 }}>
        <article className="stats-card blue">
          <h3>Today's Sales</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{todayStats.soldQty}</strong>
              <span style={{ display: 'block' }}>Qty Sold</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>{CURRENCY_SYMBOL}{todayStats.soldAmount.toFixed(2)}</strong>
              <span style={{ display: 'block' }}>Total Amount</span>
            </div>
          </div>
        </article>
        <article className="stats-card green">
          <h3>Today's Purchase</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{todayStats.purchasedQty}</strong>
              <span style={{ display: 'block' }}>Qty Purchased</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>{CURRENCY_SYMBOL}{todayStats.purchasedAmount.toFixed(2)}</strong>
              <span style={{ display: 'block' }}>Total Amount</span>
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-grid" style={{ marginTop: 20 }}>
        <div className="card">
          <h3>Weekly Sales History (Last 7 Days)</h3>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Quantity Sold</th>
                <th>Sale Date</th>
                <th>Added By</th>
              </tr>
            </thead>
            <tbody>
              {weeklySales.length > 0 ? (
                weeklySales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.itemName}</td>
                    <td>{sale.quantity}</td>
                    <td>{new Date(sale.salesDate).toLocaleDateString()}</td>
                    <td>{sale.addedBy || 'System'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: '#64748b' }}>
                    No sales in the last 7 days
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Weekly Purchase History (Last 7 Days)</h3>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Quantity Purchased</th>
                <th>Purchase Date</th>
                <th>Added By</th>
              </tr>
            </thead>
            <tbody>
              {weeklyPurchases.length > 0 ? (
                weeklyPurchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td>{purchase.itemName}</td>
                    <td>{purchase.quantity}</td>
                    <td>{new Date(purchase.purchaseDate).toLocaleDateString()}</td>
                    <td>{purchase.addedBy || 'System'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: '#64748b' }}>
                    No purchases in the last 7 days
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export default Dashboard;
