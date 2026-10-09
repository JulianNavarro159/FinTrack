const router = require('express').Router();
const {
    getCategories,
    createCategory,
    getPaymentMethods
} = require('../controllers/categoryController');
const authMiddleware = require('../../Transaction/middlewares/authMiddleware');

const optionalAuth = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return next();
    }
    return authMiddleware(req, res, next);
};

router.get('/', optionalAuth, getCategories);
router.post('/', authMiddleware, createCategory);
router.get('/payment-methods', getPaymentMethods);

module.exports = router;
