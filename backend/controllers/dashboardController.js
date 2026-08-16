import { DashboardStats } from '../models/DashboardStats.js';
export const getDashboardStats = async (req, res) => {
  const { centerIds, countingStartDate, countingEndDate } = req.query;
  let centerFilterS = '';
  let centerFilterP = '';
  let qParams = [];

  if (centerIds) {
    const ids = centerIds.split(',').map(id => Number(id)).filter(id => !isNaN(id));
    if (ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      centerFilterS = `AND centerId IN (${placeholders})`;
      centerFilterP = `AND centerId IN (${placeholders})`;
      qParams = ids;
    }
  }

  try {
    // 1. Stats Counts
    const { languages, categories, items } = await DashboardStats.getCounts();

    // 2. Today's Stats
    const salesToday = await DashboardStats.getTodaySales(centerFilterS, qParams);
    const purchasesToday = await DashboardStats.getTodayPurchases(centerFilterP, qParams);

    // 3. Weekly History
    const weeklySales = await DashboardStats.getWeeklySales(centerFilterS, qParams);
    const weeklyPurchases = await DashboardStats.getWeeklyPurchases(centerFilterP, qParams);

    // 4. Recent Counting Entries
    let countingDateFilter = '';
    let countingQueryParams = [...qParams];
    if (countingStartDate && countingEndDate) {
      countingDateFilter = 'AND ce.countingDate >= ? AND ce.countingDate <= ?';
      countingQueryParams.push(countingStartDate, countingEndDate);
    } else if (countingStartDate) {
      countingDateFilter = 'AND ce.countingDate >= ?';
      countingQueryParams.push(countingStartDate);
    } else if (countingEndDate) {
      countingDateFilter = 'AND ce.countingDate <= ?';
      countingQueryParams.push(countingEndDate);
    }

    const countingLimit = (countingStartDate || countingEndDate) ? '' : 'LIMIT 7';

    const recentCountingEntries = await DashboardStats.getRecentCountingEntries(centerFilterS, countingDateFilter, countingLimit, countingQueryParams);

    res.json({
      stats: { languages, categories, items },
      todayStats: {
        soldQty: Number(salesToday.soldQty),
        soldAmount: Number(salesToday.soldAmount),
        purchasedQty: Number(purchasesToday.purchasedQty),
        purchasedAmount: Number(purchasesToday.purchasedAmount)
      },
      weeklySales,
      weeklyPurchases,
      recentCountingEntries
    });
  } catch (err) {
    console.error('Failed to fetch dashboard stats:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getCountingGraphData = async (req, res) => {
  const { centerIds, startDate, endDate, groupBy, metric } = req.query;
  // groupBy: 'date', 'month', 'year'
  // metric: 'total', 'average'
  
  let centerFilter = '';
  let qParams = [];

  if (centerIds) {
    const ids = centerIds.split(',').map(id => Number(id)).filter(id => !isNaN(id));
    if (ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      centerFilter = `AND ce.centerId IN (${placeholders})`;
      qParams.push(...ids);
    }
  }

  let dateFilter = '';
  if (startDate && endDate) {
    dateFilter = 'AND ce.countingDate >= ? AND ce.countingDate <= ?';
    qParams.push(startDate, endDate);
  } else if (startDate) {
    dateFilter = 'AND ce.countingDate >= ?';
    qParams.push(startDate);
  } else if (endDate) {
    dateFilter = 'AND ce.countingDate <= ?';
    qParams.push(endDate);
  }

  // Determine group by clause
  const isSqlite = (process.env.DB_TYPE || 'mysql') === 'sqlite';
  
  let groupSelect = isSqlite ? "strftime('%d-%m-%Y', ce.countingDate)" : "DATE_FORMAT(ce.countingDate, '%d-%b-%Y')";
  let groupAlias = 'groupLabel';
  let sqlGroupBy = 'DATE(ce.countingDate)';

  if (groupBy === 'month') {
    groupSelect = isSqlite ? "strftime('%m-%Y', ce.countingDate)" : "DATE_FORMAT(ce.countingDate, '%b %Y')";
    sqlGroupBy = isSqlite ? "strftime('%Y-%m', ce.countingDate)" : "DATE_FORMAT(ce.countingDate, '%Y-%m')";
  } else if (groupBy === 'year') {
    groupSelect = isSqlite ? "strftime('%Y', ce.countingDate)" : "DATE_FORMAT(ce.countingDate, '%Y')";
    sqlGroupBy = isSqlite ? "strftime('%Y', ce.countingDate)" : "DATE_FORMAT(ce.countingDate, '%Y')";
  }

  // Determine metric
  let aggregateFunc = 'SUM';
  if (metric === 'average') {
    aggregateFunc = 'AVG';
  }

  try {
    const data = await DashboardStats.getCountingGraphData(groupSelect, aggregateFunc, centerFilter, dateFilter, sqlGroupBy, qParams);
    res.json(data);
  } catch (err) {
    console.error('Failed to fetch counting graph data:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
