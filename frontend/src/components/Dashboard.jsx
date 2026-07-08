import { useEffect, useState } from 'react';
import { API_BASE, createAuthHeaders } from '../utils/api';

function Dashboard({ authHeaders }) {
  const [stats, setStats] = useState({ languages: 0, categories: 0, items: 0 });
  const [todayStats, setTodayStats] = useState({ sold: 0, purchased: 0 });
  const [weeklySales, setWeeklySales] = useState([]);

  const token = localStorage.getItem('bav_auth_token');
  const headers = () => createAuthHeaders(token);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [langRes, catRes, itemRes, salesRes, purchaseRes] = await Promise.all([
          fetch(`${API_BASE}/languages`, { headers: headers() }),
          fetch(`${API_BASE}/categories`, { headers: headers() }),
          fetch(`${API_BASE}/items`, { headers: headers() }),
          fetch(`${API_BASE}/sales`, { headers: headers() }),
          fetch(`${API_BASE}/purchases`, { headers: headers() }),
        ]);

        const languages = langRes.ok ? await langRes.json() : [];
        const categories = catRes.ok ? await catRes.json() : [];
        const items = itemRes.ok ? await itemRes.json() : [];
        const sales = salesRes.ok ? await salesRes.json() : [];
        const purchases = purchaseRes.ok ? await purchaseRes.json() : [];

        setStats({
          languages: languages.length,
          categories: categories.length,
          items: items.length,
        });

        // Calculate today's statistics
        const today = new Date().toISOString().slice(0, 10);
        const todaySold = sales
          .filter((s) => s.salesDate === today)
          .reduce((sum, s) => sum + s.quantity, 0);

        const todayPurchased = purchases
          .filter((p) => p.purchaseDate === today)
          .reduce((sum, p) => sum + p.quantity, 0);

        setTodayStats({ sold: todaySold, purchased: todayPurchased });

        // Calculate weekly sales (last 7 days)
        const lastWeekDate = new Date();
        lastWeekDate.setDate(lastWeekDate.getDate() - 7);
        const weekStart = lastWeekDate.toISOString().slice(0, 10);

        const weeklySalesData = sales
          .filter((s) => s.salesDate >= weekStart)
          .map((sale) => ({
            id: sale.id,
            itemName: items.find((item) => item.id === sale.itemId)?.name || '-',
            quantity: sale.quantity,
            salesDate: sale.salesDate,
          }))
          .sort((a, b) => new Date(b.salesDate) - new Date(a.salesDate));

        setWeeklySales(weeklySalesData);
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
          <strong>{todayStats.sold}</strong>
          <span>Quantity sold today</span>
        </article>
        <article className="stats-card green">
          <h3>Today's Purchase</h3>
          <strong>{todayStats.purchased}</strong>
          <span>Quantity purchased today</span>
        </article>
      </section>

      <section style={{ marginTop: 20 }}>
        <div className="card">
          <h3>Weekly Sales History (Last 7 Days)</h3>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Quantity Sold</th>
                <th>Sale Date</th>
              </tr>
            </thead>
            <tbody>
              {weeklySales.length > 0 ? (
                weeklySales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.itemName}</td>
                    <td>{sale.quantity}</td>
                    <td>{new Date(sale.salesDate).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', color: '#64748b' }}>
                    No sales in the last 7 days
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
