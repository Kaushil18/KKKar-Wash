const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { auth } = require('../middleware/auth');

router.post('/process/:bookingId', auth, async (req, res) => {
    try {
        const { payment_method } = req.body;
        const bookingId = req.params.bookingId;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.user_id !== req.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const existingPayment = await Payment.findByBookingId(bookingId);
        if (existingPayment) {
            return res.status(400).json({ error: 'Payment already processed for this booking' });
        }

        const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        const paymentId = await Payment.create({
            booking_id: bookingId,
            amount: booking.service_price,
            payment_method,
            transaction_id: transactionId,
            status: 'completed'
        });

        await Booking.updateStatus(bookingId, 'confirmed');

        const payment = await Payment.findByBookingId(bookingId);
        res.status(201).json(payment);
    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ error: 'Server error processing payment' });
    }
});

router.get('/:bookingId', auth, async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.user_id !== req.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const payment = await Payment.findByBookingId(bookingId);
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.json(payment);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching payment' });
    }
});

module.exports = router;