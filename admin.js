const express = require('express');
const router = express.Router();
const { 
    getDashboardStats, 
    getAllBookings, 
    getRevenueReport,
    getCustomers
} = require('../controllers/adminController');
const { auth, isAdmin } = require('../middleware/auth');

router.get('/dashboard', auth, isAdmin, getDashboardStats);
router.get('/bookings', auth, isAdmin, getAllBookings);
router.get('/revenue', auth, isAdmin, getRevenueReport);
router.get('/customers', auth, isAdmin, getCustomers);

module.exports = router;