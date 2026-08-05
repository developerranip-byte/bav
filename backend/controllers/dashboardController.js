import pool from '../db.js';
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
    const [[{ languages }]] = await pool.query('SELECT COUNT(*) AS languages FROM languages');
    const [[{ categories }]] = await pool.query('SELECT COUNT(*) AS categories FROM categories');
    const [[{ items }]] = await pool.query('SELECT COUNT(*) AS items FROM items');

    // 2. Today's Stats
    const [[salesToday]] = await pool.query(`
      SELECT COALESCE(SUM(quantity), 0) AS soldQty, 
             COALESCE(SUM(salesPrice), 0) AS soldAmount 
      FROM sales 
      WHERE DATE(salesDate) = CURRENT_DATE() ${centerFilterS}
    `, qParams);

    const [[purchasesToday]] = await pool.query(`
      SELECT COALESCE(SUM(quantity), 0) AS purchasedQty, 
             COALESCE(SUM(quantity * amount), 0) AS purchasedAmount 
      FROM purchases 
      WHERE DATE(purchaseDate) = CURRENT_DATE() ${centerFilterP}
    `, qParams);

    // 3. Weekly History
    const [weeklySales] = await pool.query(`
      SELECT s.id, s.quantity, s.salesDate, 
             i.name AS itemName, 
             u.username AS addedBy 
      FROM sales s 
      LEFT JOIN items i ON s.itemId = i.id 
      LEFT JOIN users u ON s.userId = u.id 
      WHERE s.salesDate >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) ${centerFilterS.replace(/centerId/g, 's.centerId')}
      ORDER BY s.salesDate DESC
    `, qParams);

    const [weeklyPurchases] = await pool.query(`
      SELECT p.id, p.quantity, p.purchaseDate, 
             i.name AS itemName, 
             u.username AS addedBy 
      FROM purchases p 
      LEFT JOIN items i ON p.itemId = i.id 
      LEFT JOIN users u ON p.userId = u.id 
      WHERE p.purchaseDate >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) ${centerFilterP.replace(/centerId/g, 'p.centerId')}
      ORDER BY p.purchaseDate DESC
    `, qParams);

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

    const [recentCountingEntries] = await pool.query(`
      SELECT ce.id, ce.countingDate, ce.carInCount, ce.carOutCount,
             (COALESCE(ce.gentsCount, 0) + COALESCE(ce.ladiesCount, 0) + COALESCE(ce.childrenCount, 0)) AS totalSangat,
             c.name AS centerName,
             u.username AS addedBy
      FROM counting_entries ce
      LEFT JOIN centers c ON ce.centerId = c.id
      LEFT JOIN users u ON ce.userId = u.id
      WHERE 1=1 ${centerFilterS.replace(/centerId/g, 'ce.centerId')} ${countingDateFilter}
      ORDER BY ce.countingDate DESC, ce.createdAt DESC
      ${countingLimit}
    `, countingQueryParams);

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
  let groupSelect = "DATE_FORMAT(ce.countingDate, '%d-%b-%Y')";
  let groupAlias = 'groupLabel';
  let sqlGroupBy = 'DATE(ce.countingDate)';

  if (groupBy === 'month') {
    groupSelect = "DATE_FORMAT(ce.countingDate, '%b %Y')";
    sqlGroupBy = "DATE_FORMAT(ce.countingDate, '%Y-%m')";
  } else if (groupBy === 'year') {
    groupSelect = "DATE_FORMAT(ce.countingDate, '%Y')";
    sqlGroupBy = "DATE_FORMAT(ce.countingDate, '%Y')";
  }

  // Determine metric
  let aggregateFunc = 'SUM';
  if (metric === 'average') {
    aggregateFunc = 'AVG';
  }

  try {
    const query = `
      SELECT ${groupSelect} AS ${groupAlias},
             ROUND(${aggregateFunc}(COALESCE(ce.gentsCount, 0) + COALESCE(ce.ladiesCount, 0) + COALESCE(ce.childrenCount, 0)), 2) AS totalSangat,
             ROUND(${aggregateFunc}(COALESCE(ce.ladiesCount, 0)), 2) AS totalLadies,
             ROUND(${aggregateFunc}(COALESCE(ce.balPathiBoysCount, 0) + COALESCE(ce.balPathiGirlsCount, 0)), 2) AS totalBalPathi,
             ROUND(${aggregateFunc}(COALESCE(ce.balSatsangBoysCount, 0) + COALESCE(ce.balSatsangGirlsCount, 0)), 2) AS totalBalSatsang,
             ROUND(${aggregateFunc}(COALESCE(ce.threeWheelerCount, 0) + COALESCE(ce.twoWheelerCount, 0) + COALESCE(ce.fourWheelerCount, 0) + COALESCE(ce.carInCount, 0) + COALESCE(ce.carOutCount, 0)), 2) AS totalParking,
             ROUND(${aggregateFunc}(COALESCE(ce.mobileCount, 0)), 2) AS mobileCount,
             ROUND(${aggregateFunc}(COALESCE(ce.luggageCount, 0)), 2) AS luggageCount
      FROM counting_entries ce
      WHERE ce.countingDate IS NOT NULL ${centerFilter} ${dateFilter}
      GROUP BY ${sqlGroupBy}
      ORDER BY ${sqlGroupBy} ASC
    `;
    const [data] = await pool.query(query, qParams);
    res.json(data);
  } catch (err) {
    console.error('Failed to fetch counting graph data:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
