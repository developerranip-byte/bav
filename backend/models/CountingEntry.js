import pool from '../db.js';

export const CountingEntry = {
  findExisting: async (date, centerId, excludeId = null) => {
    let query = 'SELECT id FROM counting_entries WHERE countingDate = ? AND centerId = ?';
    const params = [date, centerId];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [existing] = await pool.query(query, params);
    return existing;
  },

  create: async (values) => {
    const query = `
      INSERT INTO counting_entries (
        countingDate,
        gentsCount, ladiesCount, childrenCount,
        balSatsangBoysCount, balSatsangGirlsCount,
        balPathiBoysCount, balPathiGirlsCount,
        mobileCount, luggageCount,
        threeWheelerCount, twoWheelerCount, fourWheelerCount,
        carInCount, carOutCount,
        userId, centerId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, values);
    return result.insertId;
  },

  getAllWithCenter: async () => {
    const query = `
      SELECT ce.*, c.name as centerName 
      FROM counting_entries ce
      LEFT JOIN centers c ON ce.centerId = c.id
      ORDER BY ce.countingDate DESC, ce.createdAt DESC 
      LIMIT 100
    `;
    const [rows] = await pool.query(query);
    return rows;
  },

  update: async (values) => {
    const query = `
      UPDATE counting_entries SET
        countingDate = ?, gentsCount = ?, ladiesCount = ?, childrenCount = ?,
        balSatsangBoysCount = ?, balSatsangGirlsCount = ?,
        balPathiBoysCount = ?, balPathiGirlsCount = ?,
        mobileCount = ?, luggageCount = ?,
        threeWheelerCount = ?, twoWheelerCount = ?, fourWheelerCount = ?,
        carInCount = ?, carOutCount = ?, centerId = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(query, values);
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await pool.query('DELETE FROM counting_entries WHERE id = ?', [id]);
    return result.affectedRows;
  }
};
