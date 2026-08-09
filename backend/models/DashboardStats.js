import pool from '../db.js';

export const DashboardStats = {
  getCounts: async () => {
    const [[{ languages }]] = await pool.query('SELECT COUNT(*) AS languages FROM languages');
    const [[{ categories }]] = await pool.query('SELECT COUNT(*) AS categories FROM categories');
    const [[{ items }]] = await pool.query('SELECT COUNT(*) AS items FROM items');
    return { languages, categories, items };
  },

  getTodaySales: async (centerFilterS, qParams) => {
    const [[salesToday]] = await pool.query(`
      SELECT COALESCE(SUM(quantity), 0) AS soldQty, 
             COALESCE(SUM(salesPrice), 0) AS soldAmount 
      FROM sales 
      WHERE DATE(salesDate) = CURRENT_DATE() ${centerFilterS}
    `, qParams);
    return salesToday;
  },

  getTodayPurchases: async (centerFilterP, qParams) => {
    const [[purchasesToday]] = await pool.query(`
      SELECT COALESCE(SUM(quantity), 0) AS purchasedQty, 
             COALESCE(SUM(quantity * amount), 0) AS purchasedAmount 
      FROM purchases 
      WHERE DATE(purchaseDate) = CURRENT_DATE() ${centerFilterP}
    `, qParams);
    return purchasesToday;
  },

  getWeeklySales: async (centerFilterS, qParams) => {
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
    return weeklySales;
  },

  getWeeklyPurchases: async (centerFilterP, qParams) => {
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
    return weeklyPurchases;
  },

  getRecentCountingEntries: async (centerFilterS, countingDateFilter, countingLimit, countingQueryParams) => {
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
    return recentCountingEntries;
  },

  getCountingGraphData: async (groupSelect, aggregateFunc, centerFilter, dateFilter, sqlGroupBy, qParams) => {
    const query = `
      SELECT ${groupSelect} AS groupLabel,
             ROUND(${aggregateFunc}(COALESCE(ce.gentsCount, 0) + COALESCE(ce.ladiesCount, 0) + COALESCE(ce.childrenCount, 0)), 2) AS totalSangat,
             ROUND(${aggregateFunc}(COALESCE(ce.ladiesCount, 0)), 2) AS totalLadies,
             ROUND(${aggregateFunc}(COALESCE(ce.balPathiBoysCount, 0) + COALESCE(ce.balPathiGirlsCount, 0)), 2) AS totalBalPathi,
             ROUND(${aggregateFunc}(COALESCE(ce.balSatsangBoysCount, 0) + COALESCE(ce.balSatsangGirlsCount, 0)), 2) AS totalBalSatsang,
             ROUND(${aggregateFunc}(COALESCE(ce.threeWheelerCount, 0) + COALESCE(ce.twoWheelerCount, 0) + COALESCE(ce.fourWheelerCount, 0)), 2) AS totalParking,
             ROUND(${aggregateFunc}(COALESCE(ce.mobileCount, 0)), 2) AS mobileCount,
             ROUND(${aggregateFunc}(COALESCE(ce.luggageCount, 0)), 2) AS luggageCount
      FROM counting_entries ce
      WHERE ce.countingDate IS NOT NULL ${centerFilter} ${dateFilter}
      GROUP BY ${sqlGroupBy}
      ORDER BY ${sqlGroupBy} ASC
    `;
    const [data] = await pool.query(query, qParams);
    return data;
  }
};
