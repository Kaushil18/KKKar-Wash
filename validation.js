const { body, validationResult } = require('express-validator');

const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        res.status(400).json({ errors: errors.array() });
    };
};

const userValidation = {
    register: [
        body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
        body('email').isEmail().withMessage('Invalid email address'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('full_name').trim().notEmpty().withMessage('Full name is required'),
        body('phone').optional().trim().isMobilePhone('any').withMessage('Invalid phone number')
    ],
    login: [
        body('email').isEmail().withMessage('Invalid email address'),
        body('password').notEmpty().withMessage('Password is required')
    ]
};

const bookingValidation = {
    create: [
        body('service_id').isInt({ min: 1 }).withMessage('Invalid service ID'),
        body('vehicle_id').isInt({ min: 1 }).withMessage('Invalid vehicle ID'),
        body('booking_date').isDate().withMessage('Invalid date'),
        body('booking_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
        body('notes').optional().trim()
    ]
};

const serviceValidation = {
    create: [
        body('name').trim().notEmpty().withMessage('Service name is required'),
        body('description').optional().trim(),
        body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 minute')
    ]
};

module.exports = { validate, userValidation, bookingValidation, serviceValidation };