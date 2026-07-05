const Service = require('../models/Service');

exports.getAllServices = async (req, res) => {
    try {
        const activeOnly = req.query.active === 'true';
        const services = await Service.findAll(activeOnly);
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching services' });
    }
};

exports.getService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json(service);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching service' });
    }
};

exports.createService = async (req, res) => {
    try {
        const serviceId = await Service.create(req.body);
        const service = await Service.findById(serviceId);
        res.status(201).json(service);
    } catch (error) {
        res.status(500).json({ error: 'Server error creating service' });
    }
};

exports.updateService = async (req, res) => {
    try {
        const updated = await Service.update(req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({ error: 'Service not found' });
        }
        const service = await Service.findById(req.params.id);
        res.json(service);
    } catch (error) {
        res.status(500).json({ error: 'Server error updating service' });
    }
};

exports.deleteService = async (req, res) => {
    try {
        const deleted = await Service.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error deleting service' });
    }
};