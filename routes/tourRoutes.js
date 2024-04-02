const express = require('express');
const { createTour, deleteTour, getAllTours, getTour, updateTour, aliasTopTours, getTourStats, getMonthlyPlan, getsToursWithin,getDistances } = require('../controllers/tourController');
const { update } = require('../models/tourModel');
const { protect, restrictTo } = require('../controllers/authController');
const { createReview } = require('../controllers/reviewController');
const reviewRoutes = require('../routes/reviewRoutes')
const router = express.Router()
// router.param('id', checkId)
router.route('/top-5-cheap').get(aliasTopTours, getAllTours)
router.route('/tour-stats').get(getTourStats)
router.route('/monthly-plan/:year').get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan)
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(getsToursWithin)
router.route('/distances/:latlng/unit/:unit').get(getDistances)
router.route('/').get(protect, getAllTours).post(protect, restrictTo('admin', 'lead-guide'), createTour)
router.route('/:id').get(getTour).patch(protect, restrictTo('admin', 'lead-guide'), updateTour).delete(protect, restrictTo('admin', 'lead-guide'), deleteTour)
// router.route(':tourId/reviews').post(protect,restrictTo('users'),createReview )
router.use(':tourId/reviews', reviewRoutes)
module.exports = router