const { 
    createTransaction,
    getTransaction
} = require('../controllers/transactionController');
const authMiddleware = require('../middlewares/authMiddleware');


const router = require('express').Router()

router.post('/', authMiddleware, createTransaction);
router.get('/', authMiddleware, getTransaction);

module.exports = router;
