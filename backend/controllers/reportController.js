import { Report } from '../models/Report.js';
export const getItemReports = async (req, res) => {
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const { categoryId, languageId, search, centerIds, sortBy, sortOrder } = req.query;

  const conditions = [];
  const params = [];

  if (categoryId) {
    conditions.push('items.categoryId = ?');
    params.push(categoryId);
  }
  if (languageId) {
    conditions.push('items.languageId = ?');
    params.push(languageId);
  }
  if (search && search.trim() !== '') {
    const like = `%${search.trim()}%`;
    conditions.push('items.name LIKE ?');
    params.push(like);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const allowedSortColumns = [
    'name', 'categoryName', 'languageName', 'openingQty', 
    'totalPurchased', 'totalSold', 'currentQuantity', 
    'lastPurchaseDate', 'lastSalesDate'
  ];
  
  let orderByClause = 'ORDER BY i.id DESC';
  if (sortBy && allowedSortColumns.includes(sortBy)) {
    const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';
    if (sortBy === 'name' || sortBy === 'openingQty') {
      orderByClause = `ORDER BY i.${sortBy} ${direction}, i.id DESC`;
    } else if (sortBy === 'categoryName') {
      orderByClause = `ORDER BY c.name ${direction}, i.id DESC`;
    } else if (sortBy === 'languageName') {
      orderByClause = `ORDER BY l.name ${direction}, i.id DESC`;
    } else {
      // These are calculated or aliased columns in the SELECT clause.
      // We can just use the alias name directly in ORDER BY.
      orderByClause = `ORDER BY ${sortBy} ${direction}, i.id DESC`;
    }
  }

  const { total, rows } = await Report.getItemReports({ whereClause, params, orderByClause, centerFilterP, centerFilterS, limit, offset });
  
  res.json({
    data: rows,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
};

export const getItemPurchaseHistory = async (req, res) => {
  
  const { id } = req.params;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = 10;
  const offset = (page - 1) * limit;
  const { centerIds } = req.query;
  const conditions = ['itemId = ?'];
  const qParams = [id];
  if (centerIds) {
    const ids = centerIds.split(',').map(Number).filter(n => !isNaN(n));
    if (ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      conditions.push(`centerId IN (${placeholders})`);
      qParams.push(...ids);
    }
  }
  const whereSql = conditions.join(' AND ');

  const { totalCount, rows } = await Report.getItemPurchaseHistory({ whereSql, qParams, limit, offset });
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  res.json({ rows, page, totalPages, totalCount });
};

export const getItemSalesHistory = async (req, res) => {
  
  const { id } = req.params;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = 10;
  const offset = (page - 1) * limit;
  const { centerIds } = req.query;
  const conditions = ['itemId = ?'];
  const qParams = [id];
  if (centerIds) {
    const ids = centerIds.split(',').map(Number).filter(n => !isNaN(n));
    if (ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      conditions.push(`centerId IN (${placeholders})`);
      qParams.push(...ids);
    }
  }
  const whereSql = conditions.join(' AND ');

  const { totalCount, rows } = await Report.getItemSalesHistory({ whereSql, qParams, limit, offset });
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  res.json({ rows, page, totalPages, totalCount });
};
