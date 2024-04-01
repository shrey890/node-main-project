const express = require('express');
const { getUser, deleteUser, createUser, getAllUsers, updateUser, updateMe, deleteMe, getMe } = require('../controllers/userController');
const { signup , login, forgotPassword, resetPassword, protect, updatePassword, restrictTo } = require('../controllers/authController');

const router = express.Router()
router.post('/signup',signup)
router.post('/login',login)
router.post('/forgotPassword',forgotPassword)
router.patch('/resetPassword/:token',resetPassword)
// ! protect all routes after this middleware  
router.use(protect)
router.patch('/updateMyPassword',updatePassword)
router.get('/me',getMe , getUser)
router.patch('/updateMe',updateMe)
router.patch('/deleteMe',deleteMe)
router.use(restrictTo('admin'))
router.route('/').get(getAllUsers).post(createUser)
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser)
module.exports = router