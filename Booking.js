const pool = require('../config/db');

class Booking {
    static async create(bookingData) {
        const { user_id, service_id, vehicle_id, booking_date, booking_time, notes = '' } = bookingData;
        const [result] = await pool.query(
            `INSERT INTO bookings (user_id, service_id, vehicle_id, booking_date, booking_time, notes) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, service_id, vehicle_id, booking_date, booking_time, notes]
        );
        return result.insertId;
    }

    static async findById(id) {
        const [rows] = await pool.query(
            `SELECT b.*, s.name as service_name, s.price as service_price, s.duration,
                    v.license_plate, v.make, v.model, v.color,
                    u.full_name as customer_name, u.email, u.phone
             FROM bookings b
             JOIN services s ON b.service_id = s.id
             JOIN vehicles v ON b.vehicle_id = v.id
             JOIN users u ON b.user_id = u.id
             WHERE b.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async findByUser(userId) {
        const [rows] = await pool.query(
            `SELECT b.*, s.name as service_name, s.price as service_price,
                    v.license_plate
             FROM bookings b
             JOIN services s ON b.service_id = s.id
             JOIN vehicles v ON b.vehicle_id = v.id
             WHERE b.user_id = ?
             ORDER BY b.booking_date DESC, b.booking_time DESC`,
            [userId]
        );
        return rows;
    }

    static async findAll(filters = {}) {
        let query = `
            SELECT b.*, s.name as service_name, u.full_name as customer_name, u.email,
                   v.license_plate
            FROM bookings b
            JOIN services s ON b.service_id = s.id
            JOIN users u ON b.user_id = u.id
            JOIN vehicles v ON b.vehicle_id = v.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.status) {
            query += ' AND b.status = ?';
            params.push(filters.status);
        }
        if (filters.date) {
            query += ' AND b.booking_date = ?';
            params.push(filters.date);
        }
        if (filters.service_id) {
            query += ' AND b.service_id = ?';
            params.push(filters.service_id);
        }

        query += ' ORDER BY b.booking_date DESC, b.booking_time DESC';
        const [rows] = await pool.query(query, params);
        return rows;
    }

    static async updateStatus(id, status) {
        const [result] = await pool.query(
            'UPDATE bookings SET status = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    }

    static async update(id, data) {
        const { service_id, vehicle_id, booking_date, booking_time, notes } = data;
        const [result] = await pool.query(
            `UPDATE bookings SET service_id = ?, vehicle_id = ?, booking_date = ?, 
             booking_time = ?, notes = ? WHERE id = ?`,
            [service_id, vehicle_id, booking_date, booking_time, notes, id]
        );
        return result.affectedRows > 0;
    }

    static async cancel(id) {
        const [result] = await pool.query(
            'UPDATE bookings SET status = "cancelled" WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async getAvailableSlots(date, serviceId = null) {
        let query = `
            SELECT booking_time 
            FROM bookings 
            WHERE booking_date = ? AND status != 'cancelled'
        `;
        const params = [date];

        if (serviceId) {
            query += ' AND service_id = ?';
            params.push(serviceId);
        }

        const [rows] = await pool.query(query, params);
        return rows.map(row => row.booking_time);
    }

    static async getDailyReport(date) {
        const [rows] = await pool.query(
            `SELECT 
                COUNT(*) as total_bookings,
                SUM(s.price) as total_revenue,
                COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_count
             FROM bookings b
             JOIN services s ON b.service_id = s.id
             WHERE b.booking_date = ? AND b.status != 'cancelled'`,
            [date]
        );
        return rows[0];
    }

    static async getRevenueStats(startDate, endDate) {
        const [rows] = await pool.query(
            `SELECT 
                DATE(booking_date) as date,
                COUNT(*) as bookings,
                SUM(s.price) as revenue
             FROM bookings b
             JOIN services s ON b.service_id = s.id
             WHERE b.booking_date BETWEEN ? AND ? 
             AND b.status = 'completed'
             GROUP BY DATE(booking_date)
             ORDER BY date DESC`,
            [startDate, endDate]
        );
        return rows;
    }
}

module.exports = Booking;