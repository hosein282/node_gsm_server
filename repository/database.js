// src/repositories/database.js
const pool = require('../config/database');

const db = {
    query: async (sql, params = []) => {
        try {
            const result = await new Promise((resolve, reject) => {
                pool.execute(sql, params, (err, results) => {
                    if (err) {
                        console.error('Error data:', err);
                        return reject(err); // Reject the promise on error
                    }
                    resolve(results); // Resolve the promise with the results
                });
            });
            return result; // Return the result
        } catch (err) {
            console.error('Database Error:', err);
            throw err; // Rethrow the error to handle it upstream
        }
    },

    // ایجاد عملیات CRUD
    create: async (table, data) => {
        const keys = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map(() => '?').join(', ');

        const sql = `INSERT INTO ${table} (${keys}) VALUES (${placeholders})`;
        return await db.query(sql, values);
    },

    read: async (table, columns = [], conditions = {}) => {
        const column = columns.length ? columns.join() : '*';
        const keys = Object.keys(conditions);
        const whereClause = keys.length
            ? 'WHERE ' + keys.map((key) => `${key} = ?`).join(' AND ')
            : '';

        const values = Object.values(conditions);

        const sql = `SELECT ${column} FROM ${table} ${whereClause}`;

        return await db.query(sql, values);
    },

    update: async (table, data, conditions) => {
        const setClause = Object.keys(data)
            .map((key) => `${key} = ?`)
            .join(', ');
        const whereClause = Object.keys(conditions)
            .map((key) => `${key} = ?`)
            .join(' AND ');

        const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
        const values = [...Object.values(data), ...Object.values(conditions)];
        return await db.query(sql, values);
    },

    delete: async (table, conditions) => {
        const whereClause = Object.keys(conditions)
            .map((key) => `${key} = ?`)
            .join(' AND ');

        const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
        const values = Object.values(conditions);
        return await db.query(sql, values);
    },
};

module.exports = db;
