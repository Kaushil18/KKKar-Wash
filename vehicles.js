const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    try {
        const vehicles = await Vehicle.findByUser(req.userId);
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching vehicles' });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { license_plate, make, model, color, is_default } = req.body;
        const vehicleId = await Vehicle.create({
            user_id: req.userId,
            license_plate,
            make,
            model,
            color,
            is_default
        });
        const vehicle = await Vehicle.findById(vehicleId);
        res.status(201).json(vehicle);
    } catch (error) {
        res.status(500).json({ error: 'Server error creating vehicle' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        if (vehicle.user_id !== req.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const deleted = await Vehicle.delete(req.params.id);
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error deleting vehicle' });
    }
});

module.exports = router;