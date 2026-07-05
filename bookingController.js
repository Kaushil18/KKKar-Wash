const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Vehicle = require('../models/Vehicle');
const Payment = require('../models/Payment');

exports.createBooking = async (req, res) => {
    try {
        const { service_id, vehicle_id, booking_date, booking_time, notes } = req.body;
        const user_id = req.userId;

        const service = await Service.findById(service_id);
        if (!service) {
            return res.status(400).json({ error: 'Invalid service' });
        }

        const vehicle = await Vehicle.findById(vehicle_id);
        if (!vehicle || vehicle.user_id !== user_id) {
            return res.status(400).json({ error: 'Invalid vehicle' });
        }

        const bookedSlots = await Booking.getAvailableSlots(booking_date);
        if (bookedSlots.includes(booking_time)) {
            return res.status(400).json({ error: 'Time slot already booked' });
        }

        const bookingId = await Booking.create({
            user_id,
            service_id,
            vehicle_id,
            booking_date,
            booking_time,
            notes
        });

        const booking = await Booking.findById(bookingId);
        res.status(201).json(booking);
    } catch (error) {
        console.error('Booking creation error:', error);
        res.status(500).json({ error: 'Server error creating booking' });
    }
};

exports.getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.findByUser(req.userId);
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching bookings' });
    }
};

exports.getBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.user_id !== req.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching booking' });
    }
};

exports.updateBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.user_id !== req.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (booking.status === 'completed' || booking.status === 'cancelled') {
            return res.status(400).json({ error: 'Cannot update a completed or cancelled booking' });
        }

        const { service_id, vehicle_id, booking_date, booking_time, notes } = req.body;
        
        if (booking_date && booking_time) {
            const bookedSlots = await Booking.getAvailableSlots(booking_date);
            const currentSlot = booking.booking_time;
            if (booking_date !== booking.booking_date || booking_time !== currentSlot) {
                if (bookedSlots.includes(booking_time)) {
                    return res.status(400).json({ error: 'Time slot already booked' });
                }
            }
        }

        const updated = await Booking.update(req.params.id, {
            service_id: service_id || booking.service_id,
            vehicle_id: vehicle_id || booking.vehicle_id,
            booking_date: booking_date || booking.booking_date,
            booking_time: booking_time || booking.booking_time,
            notes: notes !== undefined ? notes : booking.notes
        });

        if (!updated) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const updatedBooking = await Booking.findById(req.params.id);
        res.json(updatedBooking);
    } catch (error) {
        res.status(500).json({ error: 'Server error updating booking' });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.user_id !== req.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (booking.status === 'completed') {
            return res.status(400).json({ error: 'Cannot cancel a completed booking' });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ error: 'Booking already cancelled' });
        }

        const cancelled = await Booking.cancel(req.params.id);
        if (!cancelled) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const payment = await Payment.findByBookingId(req.params.id);
        if (payment && payment.status === 'pending') {
            await Payment.updateStatus(payment.id, 'failed');
        }

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error cancelling booking' });
    }
};

exports.updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const updated = await Booking.updateStatus(req.params.id, status);
        if (!updated) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const updatedBooking = await Booking.findById(req.params.id);
        res.json(updatedBooking);
    } catch (error) {
        res.status(500).json({ error: 'Server error updating booking status' });
    }
};

exports.getAvailableSlots = async (req, res) => {
    try {
        const { date, service_id } = req.query;
        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        const bookedSlots = await Booking.getAvailableSlots(date, service_id);
        
        const allSlots = [];
        for (let hour = 9; hour <= 18; hour++) {
            for (let minute of [0, 30]) {
                if (hour === 18 && minute > 0) continue;
                const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                allSlots.push(time);
            }
        }

        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
        res.json(availableSlots);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching available slots' });
    }
};