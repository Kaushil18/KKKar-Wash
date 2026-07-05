const express = require('express');
const router = express.Router();
const { 
    createBooking, 
    getUserBookings, 
    getBooking, 
    updateBooking, 
    cancelBooking,
    updateBookingStatus,
    getAvailableSlots
} = require('../controllers/bookingController');
const { auth, isAdmin } = require('../middleware/auth');
const { validate, bookingValidation } = require('../middleware/validation');

router.get('/available-slots', auth, getAvailableSlots);
router.post('/', auth, validate(bookingValidation.create), createBooking);
router.get('/', auth, getUserBookings);
router.get('/:id', auth, getBooking);
router.put('/:id', auth, validate(bookingValidation.create), updateBooking);
router.delete('/:id', auth, cancelBooking);
router.patch('/:id/status', auth, isAdmin, updateBookingStatus);

module.exports = router;