const pool = require('../config/db');

class Service {
    static async findAll(activeOnly = false) {
        let query = 'SELECT * FROM services';
        if (activeOnly) {
            query += ' WHERE is_active = TRUE';
        }
        query += ' ORDER BY name';
        const [rows] = await pool.query(query);
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(serviceData) {
        const { name, description, price, duration, is_active = true } = serviceData;
        const [result] = await pool.query(
            'INSERT INTO services (name, description, price, duration, is_active) VALUES (?, ?, ?, ?, ?)',
            [name, description, price, duration, is_active]
        );
        return result.insertId;
    }

    static async update(id, serviceData) {
        const { name, description, price, duration, is_active } = serviceData;
        const [result] = await pool.query(
            'UPDATE services SET name = ?, description = ?, price = ?, duration = ?, is_active = ? WHERE id = ?',
            [name, description, price, duration, is_active, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM services WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Service;