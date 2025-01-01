// src/repository/database.js
const pool = require('../config/database');

const db = {
  query: async (sql, params = []) => {
    try {
      const result = await pool.query(sql, params);
      return result.rows; // Return the rows from the result
    } catch (err) {
      console.error('Database Error:', err);
      throw err; // Rethrow the error to handle it upstream
    }
  },

  create: async (table, data) => {
    const keys = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const sql = `INSERT INTO ${table} (${keys}) VALUES (${placeholders}) RETURNING *`;
    return await db.query(sql, values);
  },

  read: async (table, columns = [], conditions = {}) => {
    const column = columns.length ? columns.join(', ') : '*';
    const keys = Object.keys(conditions);
    const whereClause = keys.length
      ? 'WHERE ' + keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ')
      : '';

    const values = Object.values(conditions);

    const sql = `SELECT ${column} FROM ${table} ${whereClause}`;
    return await db.query(sql, values);
  },

  update: async (table, data, conditions) => {
    const setClause = Object.keys(data)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    const whereClause = Object.keys(conditions)
      .map((key, index) => `${key} = $${index + 1 + Object.keys(data).length}`)
      .join(' AND ');

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`;
    const values = [...Object.values(data), ...Object.values(conditions)];
    return await db.query(sql, values);
  },

  delete: async (table, conditions) => {
    const whereClause = Object.keys(conditions)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(' AND ');

    const sql = `DELETE FROM ${table} WHERE ${whereClause} RETURNING *`;
    const values = Object.values(conditions);
    return await db.query(sql, values);
  },
};

module.exports = db