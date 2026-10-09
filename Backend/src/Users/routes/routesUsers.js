const router = require('express').Router();
const {
    userRegister,
    userLogin,
    getMyProfile,
    updateProfile,
    updateCurrency,
    userByEmail
} = require('../controllers/userController');
const authMiddleware = require('../../Transaction/middlewares/authMiddleware');
const upload = require('../../configCloudinary');

router.post('/register', upload.single('profilephoto'), userRegister);
router.post('/', upload.single('profilephoto'), userRegister);
router.post('/login', userLogin);
router.get('/me', authMiddleware, getMyProfile);
router.put('/profile', authMiddleware, upload.single('profilephoto'), updateProfile);
router.put('/me', authMiddleware, upload.single('profilephoto'), updateProfile);
router.patch('/currency', authMiddleware, updateCurrency);
router.get('/:email', userByEmail);

module.exports = router;