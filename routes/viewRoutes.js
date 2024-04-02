const express = require('express');
const { protect } = require('../controllers/authController');
const { getAccount, getOverview, getTour, getLoginForm } = require('../controllers/viewsController');
const router = express.Router();
router.get('/', getOverview);
router.get('/tour/:slug', getTour);
router.get('/login', getLoginForm);
// router.get('/me', protect, getAccount);
// router.post(
//     '/submit-user-data',
//     authController.protect,
//     viewsController.updateUserData
// );
module.exports = router;
