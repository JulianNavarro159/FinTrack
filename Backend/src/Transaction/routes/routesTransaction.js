const router = require('express').Router();
const {
    createTransaction,
    getTransaction,
    getMonthlySummary,
    deleteTransaction,
    updateTransaction
} = require('../controllers/transactionController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/summary', authMiddleware, getMonthlySummary);
router.get('/', authMiddleware, getTransaction);
router.post('/', authMiddleware, createTransaction);
router.put('/:id', authMiddleware, updateTransaction);
router.delete('/:id', authMiddleware, deleteTransaction);

module.exports = router;
