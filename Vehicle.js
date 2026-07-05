const pool = require('../config/db');

class Vehicle {
    static async findByUser(userId) {
        const [rows] = await pool.query(
            'SELECT * FROM vehicles WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
            [userId]
        );
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(vehicleData) {
        const { user_id, license_plate, make, model, color, is_default = false } = vehicleData;
        const [result] = await pool.query(
            'INSERT INTO vehicles (user_id, license_plate, make, model, color, is_default) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, license_plate, make, model, color, is_default]
        );
        return result.insertId;
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM vehicles WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Vehicle;