const pool = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    static async findByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT id, username, email, full_name, phone, role, created_at FROM users WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(userData) {
        const { username, email, password, full_name, phone, role = 'customer' } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, hashedPassword, full_name, phone, role]
        );
        return result.insertId;
    }

    static async comparePassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    static async getAllCustomers() {
        const [rows] = await pool.query(
            'SELECT id, username, email, full_name, phone, created_at FROM users WHERE role = "customer" ORDER BY created_at DESC'
        );
        return rows;
    }

    static async updateProfile(userId, data) {
        const { full_name, phone } = data;
        const [result] = await pool.query(
            'UPDATE users SET full_name = ?, phone = ? WHERE id = ?',
            [full_name, phone, userId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = User;