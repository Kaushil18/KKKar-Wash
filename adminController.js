const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const Payment = require('../models/Payment');

exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const todayStats = await Booking.getDailyReport(today);
        
        const allBookings = await Booking.findAll();
        const totalBookings = allBookings.length;
        
        const services = await Service.findAll();
        
        const customers = await User.getAllCustomers();
        
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weeklyRevenue = await Booking.getRevenueStats(
            weekAgo.toISOString().split('T')[0],
            today
        );

        res.json({
            today: {
                bookings: todayStats.total_bookings || 0,
                revenue: todayStats.total_revenue || 0,
                completed: todayStats.completed_count || 0
            },
            total: {
                bookings: totalBookings,
                services: services.length,
                customers: customers.length
            },
            weeklyRevenue: weeklyRevenue
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Server error fetching dashboard stats' });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const { status, date, service_id } = req.query;
        const bookings = await Booking.findAll({ status, date, service_id });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching bookings' });
    }
};

exports.getRevenueReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const revenue = await Booking.getRevenueStats(startDate, endDate);
        const totalRevenue = revenue.reduce((sum, day) => sum + Number(day.revenue), 0);
        const totalBookings = revenue.reduce((sum, day) => sum + day.bookings, 0);

        res.json({
            period: { startDate, endDate },
            totalRevenue,
            totalBookings,
            dailyData: revenue
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error generating revenue report' });
    }
};

exports.getCustomers = async (req, res) => {
    try {
        const customers = await User.getAllCustomers();
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching customers' });
    }
};