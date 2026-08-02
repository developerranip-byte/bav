import { useEffect, useState, useMemo } from 'react';
import { API_BASE, createAuthHeaders } from '../utils/api';
import { CURRENCY_SYMBOL } from '../utils/config';
import Loader from './Loader';

function Dashboard({ authHeaders }) {
  const [stats, setStats] = useState({ languages: 0, categories: 0, items: 0 });
  const [todayStats, setTodayStats] = useState({ soldQty: 0, soldAmount: 0, purchasedQty: 0, purchasedAmount: 0 });
  const [weeklySales, setWeeklySales] = useState([]);
  const [weeklyPurchases, setWeeklyPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [centers, setCenters] = useState([]);
  const [selectedCenters, setSelectedCenters] = useState([]);

  const token = localStorage.getItem('bav_auth_token');
  const headers = () => createAuthHeaders(token);

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

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const centerRes = await fetch(`${API_BASE}/centers`, { headers: headers() });
        if (centerRes.ok) {
          const centersData = await centerRes.json();
          setCenters(centersData);
        }
      } catch (err) {
        console.error('Failed to fetch centers:', err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        let url = `${API_BASE}/dashboard/stats`;
        if (selectedCenters.length > 0) {
          url += `?centerIds=${selectedCenters.join(',')}`;
        }
        const res = await fetch(url, { headers: headers() });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setTodayStats(data.todayStats);
          setWeeklySales(data.weeklySales);
          setWeeklyPurchases(data.weeklyPurchases);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [selectedCenters]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '60vh', position: 'relative' }}>
        <Loader overlay />
      </div>
    );
  }

  return (
    <>
      <section className="page-card" style={{ marginBottom: 20 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div>
            <h2>Dashboard</h2>
            <p style={{ marginTop: 8 }}>Overview of system metrics and activities.</p>
          </div>
        </div>
        {availableCenters.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <label className="field-label" style={{ marginBottom: 8 }}>Filter by Centers:</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                <input
                  type="checkbox"
                  checked={selectedCenters.length === availableCenters.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCenters(availableCenters.map(c => c.id));
                    } else {
                      setSelectedCenters([]);
                    }
                  }}
                />
                All Centers
              </label>
              <div style={{ width: '2px', background: '#cbd5e1', margin: '0 4px', borderRadius: '2px' }}></div>
              {availableCenters.map(center => (
                <label key={center.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={selectedCenters.includes(center.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCenters([...selectedCenters, center.id]);
                      } else {
                        setSelectedCenters(selectedCenters.filter(id => id !== center.id));
                      }
                    }}
                  />
                  {center.name}
                </label>
              ))}
            </div>
          </div>
        )}
      </section>

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
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
          <h3>Today's Stock In</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <strong>{todayStats.purchasedQty}</strong>
              <span style={{ display: 'block' }}>Qty Stocked</span>
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
          <h3>Weekly Stock History (Last 7 Days)</h3>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Quantity Stocked</th>
                <th>Stock Date</th>
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
                    No stock recorded in the last 7 days
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
