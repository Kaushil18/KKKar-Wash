const express = require('express');
const router = express.Router();
const { 
    getAllServices, 
    getService, 
    createService, 
    updateService, 
    deleteService 
} = require('../controllers/serviceController');
const { auth, isAdmin } = require('../middleware/auth');
const { validate, serviceValidation } = require('../middleware/validation');

router.get('/', getAllServices);
router.get('/:id', getService);
router.post('/', auth, isAdmin, validate(serviceValidation.create), createService);
router.put('/:id', auth, isAdmin, validate(serviceValidation.create), updateService);
router.delete('/:id', auth, isAdmin, deleteService);

module.exports = router;