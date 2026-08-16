import { useEffect, useState, useMemo } from 'react';
import { API_BASE, createAuthHeaders } from '../utils/api';
import { CURRENCY_SYMBOL } from '../utils/config';
import Loader from './Loader';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Dashboard({ authHeaders }) {
  const [stats, setStats] = useState({ languages: 0, categories: 0, items: 0 });
  const [todayStats, setTodayStats] = useState({ soldQty: 0, soldAmount: 0, purchasedQty: 0, purchasedAmount: 0 });
  const [weeklySales, setWeeklySales] = useState([]);
  const [weeklyPurchases, setWeeklyPurchases] = useState([]);
  const [recentCountingEntries, setRecentCountingEntries] = useState([]);
  const [countingStartDate, setCountingStartDate] = useState('');
  const [countingEndDate, setCountingEndDate] = useState('');
  const [graphData, setGraphData] = useState([]);
  const username = localStorage.getItem('bav_username') || 'default';

  const [graphGroupBy, setGraphGroupBy] = useState(() => localStorage.getItem(`bav_graph_groupBy_${username}`) || 'date');
  const [graphMetric, setGraphMetric] = useState(() => localStorage.getItem(`bav_graph_metric_${username}`) || 'total');
  const [graphChartType, setGraphChartType] = useState(() => localStorage.getItem(`bav_graph_chartType_${username}`) || 'bar');
  const [graphSelectedColumns, setGraphSelectedColumns] = useState(() => {
    try {
      const cols = localStorage.getItem(`bav_graph_columns_${username}`);
      return cols ? JSON.parse(cols) : ['totalSangat'];
    } catch {
      return ['totalSangat'];
    }
  });
  const [isGraphLoading, setIsGraphLoading] = useState(true);
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
        const params = new URLSearchParams();
        if (selectedCenters.length > 0) {
          params.append('centerIds', selectedCenters.join(','));
        }
        if (countingStartDate) params.append('countingStartDate', countingStartDate);
        if (countingEndDate) params.append('countingEndDate', countingEndDate);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const res = await fetch(url, { headers: headers() });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setTodayStats(data.todayStats);
          setWeeklySales(data.weeklySales);
          setWeeklyPurchases(data.weeklyPurchases);
          setRecentCountingEntries(data.recentCountingEntries || []);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [selectedCenters, countingStartDate, countingEndDate]);

  useEffect(() => {
    localStorage.setItem(`bav_graph_groupBy_${username}`, graphGroupBy);
    localStorage.setItem(`bav_graph_metric_${username}`, graphMetric);
    localStorage.setItem(`bav_graph_chartType_${username}`, graphChartType);
    localStorage.setItem(`bav_graph_columns_${username}`, JSON.stringify(graphSelectedColumns));
  }, [graphGroupBy, graphMetric, graphChartType, graphSelectedColumns, username]);

  useEffect(() => {
    const fetchGraphData = async () => {
      setIsGraphLoading(true);
      try {
        let url = `${API_BASE}/dashboard/counting-graph`;
        const params = new URLSearchParams();
        if (selectedCenters.length > 0) {
          params.append('centerIds', selectedCenters.join(','));
        }
        if (countingStartDate) params.append('startDate', countingStartDate);
        if (countingEndDate) params.append('endDate', countingEndDate);
        params.append('groupBy', graphGroupBy);
        params.append('metric', graphMetric);
        
        url += `?${params.toString()}`;
        
        const res = await fetch(url, { headers: headers() });
        if (res.ok) {
          const data = await res.json();
          setGraphData(data);
        }
      } catch (err) {
        console.error('Failed to fetch graph data:', err);
      } finally {
        setIsGraphLoading(false);
      }
    };
    fetchGraphData();
  }, [selectedCenters, countingStartDate, countingEndDate, graphGroupBy, graphMetric]);

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

      <section className="dashboard-grid" style={{ marginTop: 20 }}>
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
            <h3>Counting Trends</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label className="field-label" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>Group By</label>
                <select 
                  value={graphGroupBy} 
                  onChange={(e) => setGraphGroupBy(e.target.value)}
                  style={{ padding: '6px 10px', margin: 0 }}
                >
                  <option value="date">Date-wise</option>
                  <option value="month">Month-wise</option>
                  <option value="year">Year-wise</option>
                </select>
              </div>
              <div>
                <label className="field-label" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>Metric</label>
                <select 
                  value={graphMetric} 
                  onChange={(e) => setGraphMetric(e.target.value)}
                  style={{ padding: '6px 10px', margin: 0 }}
                >
                  <option value="total">Total</option>
                  <option value="average">Average</option>
                </select>
              </div>
              <div>
                <label className="field-label" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>Chart Type</label>
                <select 
                  value={graphChartType} 
                  onChange={(e) => setGraphChartType(e.target.value)}
                  style={{ padding: '6px 10px', margin: 0 }}
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="area">Area Chart</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="field-label" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>Data Columns</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff' }}>
                  {[
                    { id: 'totalSangat', label: 'Total Sangat', color: '#8884d8' },
                    { id: 'totalLadies', label: 'Total Ladies', color: '#e83e8c' },
                    { id: 'totalBalPathi', label: 'Total Bal Pathi', color: '#ffc107' },
                    { id: 'totalBalSatsang', label: 'Total Bal Satsang', color: '#fd7e14' },
                    { id: 'totalParking', label: 'Total Parking', color: '#82ca9d' },
                    { id: 'mobileCount', label: 'Mobile Count', color: '#17a2b8' },
                    { id: 'luggageCount', label: 'Luggage Count', color: '#6c757d' },
                    { id: 'sscdCarIn', label: 'SSCD In', color: '#3b82f6' },
                    { id: 'sscdCarOut', label: 'SSCD Out', color: '#ef4444' }
                  ].map(col => (
                    <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={graphSelectedColumns.includes(col.id)} 
                        onChange={(e) => {
                          if (e.target.checked) {
                            setGraphSelectedColumns(prev => [...prev, col.id]);
                          } else {
                            setGraphSelectedColumns(prev => prev.filter(c => c !== col.id));
                          }
                        }}
                      />
                      <span style={{ color: col.color, fontWeight: '500' }}>{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ height: 400, width: '100%', position: 'relative' }}>
            {isGraphLoading ? (
               <Loader overlay />
            ) : graphData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {graphChartType === 'line' ? (
                  <LineChart data={graphData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="groupLabel" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {graphSelectedColumns.includes('totalSangat') && <Line type="monotone" dataKey="totalSangat" name="Total Sangat" stroke="#8884d8" strokeWidth={2} />}
                    {graphSelectedColumns.includes('totalLadies') && <Line type="monotone" dataKey="totalLadies" name="Total Ladies" stroke="#e83e8c" strokeWidth={2} />}
                    {graphSelectedColumns.includes('totalBalPathi') && <Line type="monotone" dataKey="totalBalPathi" name="Total Bal Pathi" stroke="#ffc107" strokeWidth={2} />}
                    {graphSelectedColumns.includes('totalBalSatsang') && <Line type="monotone" dataKey="totalBalSatsang" name="Total Bal Satsang" stroke="#fd7e14" strokeWidth={2} />}
                    {graphSelectedColumns.includes('totalParking') && <Line type="monotone" dataKey="totalParking" name="Total Parking" stroke="#82ca9d" strokeWidth={2} />}
                    {graphSelectedColumns.includes('mobileCount') && <Line type="monotone" dataKey="mobileCount" name="Mobile Count" stroke="#17a2b8" strokeWidth={2} />}
                    {graphSelectedColumns.includes('luggageCount') && <Line type="monotone" dataKey="luggageCount" name="Luggage Count" stroke="#6c757d" strokeWidth={2} />}
                    {graphSelectedColumns.includes('sscdCarIn') && <Line type="monotone" dataKey="sscdCarIn" name="SSCD In" stroke="#3b82f6" strokeWidth={2} />}
                    {graphSelectedColumns.includes('sscdCarOut') && <Line type="monotone" dataKey="sscdCarOut" name="SSCD Out" stroke="#ef4444" strokeWidth={2} />}
                  </LineChart>
                ) : graphChartType === 'area' ? (
                  <AreaChart data={graphData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="groupLabel" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {graphSelectedColumns.includes('totalSangat') && <Area type="monotone" dataKey="totalSangat" name="Total Sangat" fill="#8884d8" stroke="#8884d8" fillOpacity={0.3} />}
                    {graphSelectedColumns.includes('totalLadies') && <Area type="monotone" dataKey="totalLadies" name="Total Ladies" fill="#e83e8c" stroke="#e83e8c" fillOpacity={0.3} />}
                    {graphSelectedColumns.includes('totalBalPathi') && <Area type="monotone" dataKey="totalBalPathi" name="Total Bal Pathi" fill="#ffc107" stroke="#ffc107" fillOpacity={0.3} />}
                    {graphSelectedColumns.includes('totalBalSatsang') && <Area type="monotone" dataKey="totalBalSatsang" name="Total Bal Satsang" fill="#fd7e14" stroke="#fd7e14" fillOpacity={0.3} />}
                    {graphSelectedColumns.includes('totalParking') && <Area type="monotone" dataKey="totalParking" name="Total Parking" fill="#82ca9d" stroke="#82ca9d" fillOpacity={0.3} />}
                    {graphSelectedColumns.includes('mobileCount') && <Area type="monotone" dataKey="mobileCount" name="Mobile Count" fill="#17a2b8" stroke="#17a2b8" fillOpacity={0.3} />}
                    {graphSelectedColumns.includes('luggageCount') && <Area type="monotone" dataKey="luggageCount" name="Luggage Count" fill="#6c757d" stroke="#6c757d" fillOpacity={0.3} />}
                    {graphSelectedColumns.includes('sscdCarIn') && <Area type="monotone" dataKey="sscdCarIn" name="SSCD In" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.3} />}
                    {graphSelectedColumns.includes('sscdCarOut') && <Area type="monotone" dataKey="sscdCarOut" name="SSCD Out" fill="#ef4444" stroke="#ef4444" fillOpacity={0.3} />}
                  </AreaChart>
                ) : (
                  <BarChart data={graphData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="groupLabel" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {graphSelectedColumns.includes('totalSangat') && <Bar dataKey="totalSangat" name="Total Sangat" fill="#8884d8" />}
                    {graphSelectedColumns.includes('totalLadies') && <Bar dataKey="totalLadies" name="Total Ladies" fill="#e83e8c" />}
                    {graphSelectedColumns.includes('totalBalPathi') && <Bar dataKey="totalBalPathi" name="Total Bal Pathi" fill="#ffc107" />}
                    {graphSelectedColumns.includes('totalBalSatsang') && <Bar dataKey="totalBalSatsang" name="Total Bal Satsang" fill="#fd7e14" />}
                    {graphSelectedColumns.includes('totalParking') && <Bar dataKey="totalParking" name="Total Parking" fill="#82ca9d" />}
                    {graphSelectedColumns.includes('mobileCount') && <Bar dataKey="mobileCount" name="Mobile Count" fill="#17a2b8" />}
                    {graphSelectedColumns.includes('luggageCount') && <Bar dataKey="luggageCount" name="Luggage Count" fill="#6c757d" />}
                    {graphSelectedColumns.includes('sscdCarIn') && <Bar dataKey="sscdCarIn" name="SSCD In" fill="#3b82f6" />}
                    {graphSelectedColumns.includes('sscdCarOut') && <Bar dataKey="sscdCarOut" name="SSCD Out" fill="#ef4444" />}
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>
                No data available for graph
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-grid" style={{ marginTop: 20 }}>
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
            <h3>{(countingStartDate || countingEndDate) ? 'Filtered Counting Entries' : 'Recent Counting Entries (Last 7)'}</h3>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label className="field-label" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>From Date</label>
                <input 
                  type="date" 
                  value={countingStartDate} 
                  max={new Date().toISOString().split('T')[0]} 
                  onChange={(e) => setCountingStartDate(e.target.value)} 
                  style={{ padding: '6px 10px', margin: 0 }}
                />
              </div>
              <div>
                <label className="field-label" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>To Date</label>
                <input 
                  type="date" 
                  value={countingEndDate} 
                  max={new Date().toISOString().split('T')[0]} 
                  onChange={(e) => setCountingEndDate(e.target.value)} 
                  style={{ padding: '6px 10px', margin: 0 }}
                />
              </div>
            </div>
          </div>
          
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Center</th>
                <th>Total Sangat</th>
                <th>Total Bal Satsang</th>
                <th>Total Bal Pathi</th>
                <th>Mobile</th>
                <th>Luggage</th>
                <th>Total Parking</th>
                <th>SSCD Car In</th>
                <th>SSCD Car Out</th>
                <th>Added By</th>
              </tr>
            </thead>
            <tbody>
              {recentCountingEntries.length > 0 ? (
                recentCountingEntries.map((entry) => {
                  const totalBalSatsang = (entry.balSatsangBoysCount || 0) + (entry.balSatsangGirlsCount || 0);
                  const totalBalPathi = (entry.balPathiBoysCount || 0) + (entry.balPathiGirlsCount || 0);
                  const totalParking = (entry.threeWheelerCount || 0) + (entry.twoWheelerCount || 0) + (entry.fourWheelerCount || 0);
                  return (
                    <tr key={entry.id}>
                      <td>{new Date(entry.countingDate).toLocaleDateString()}</td>
                      <td>{entry.centerName || '-'}</td>
                      <td>{entry.totalSangat}</td>
                      <td>{totalBalSatsang}</td>
                      <td>{totalBalPathi}</td>
                      <td>{entry.mobileCount || 0}</td>
                      <td>{entry.luggageCount || 0}</td>
                      <td>{totalParking}</td>
                      <td>{entry.carInCount || 0}</td>
                      <td>{entry.carOutCount || 0}</td>
                      <td>{entry.addedBy || 'System'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', color: '#64748b' }}>
                    No recent counting entries found
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
