const pool = require('../config/db');

class Payment {
    static async create(paymentData) {
        const { booking_id, amount, payment_method, transaction_id, status = 'pending' } = paymentData;
        const [result] = await pool.query(
            `INSERT INTO payments (booking_id, amount, payment_method, transaction_id, status) 
             VALUES (?, ?, ?, ?, ?)`,
            [booking_id, amount, payment_method, transaction_id, status]
        );
        return result.insertId;
    }

    static async findByBookingId(bookingId) {
        const [rows] = await pool.query(
            'SELECT * FROM payments WHERE booking_id = ? ORDER BY payment_date DESC',
            [bookingId]
        );
        return rows[0];
    }

    static async updateStatus(paymentId, status) {
        const [result] = await pool.query(
            'UPDATE payments SET status = ? WHERE id = ?',
            [status, paymentId]
        );
        return result.affectedRows > 0;
    }

    static async findByTransactionId(transactionId) {
        const [rows] = await pool.query(
            'SELECT * FROM payments WHERE transaction_id = ?',
            [transactionId]
        );
        return rows[0];
    }
}

module.exports = Payment;