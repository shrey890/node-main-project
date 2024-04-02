// const fs = require('fs');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory')
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`))
exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next()
}
exports.getAllTours = factory.getAll(Tour)
// exports.getAllTours = async (req, res, next) => {
//     // ! build query
//     // const queryObj = { ...req.query }
//     // const excludeFields = ['page', 'sort', 'limit', 'fields']
//     // excludeFields.forEach(el => delete queryObj[el])
//     // let queryStr = JSON.stringify(queryObj)
//     // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)
//     // let query = Tour.find(JSON.parse(queryStr));
//     // const tours = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy')
//     //    ? 2) sorting
//     // if (req.query.sort) {
//     //     const sortBy = req.query.sort.split(',').join(' ')
//     //     query = query.sort(sortBy)
//     // } else {
//     //     query = query.sort('-createdAt')
//     // }
//     // ? 3) field limiting
//     // if (req.query.field) {
//     //     const fields = req.query.fields.split(',').join(' ')
//     //     query = query.select(fields)
//     // } else {
//     //     query = query.select('-__v')
//     // }
//     // ? 4) pagination
//     // const page = req.query.page * 1 || 1
//     // const limit = req.query.limit * 1 || 100
//     // const skip = (page - 1) * limit
//     // query = query.skip(skip).limit(limit)
//     // if (req.query.page) {
//     //     const numTours = await Tour.countDocuments()
//     //     if (skip >= numTours) {
//     //         throw new Error('this page does not exist')
//     //     }
//     // }
//     // ! execute query
//     const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginete()
//     const tours = await features.query
//     // ! send response
//     res.status(200).json({
//         status: "success",
//         result: tours.length,
//         data: {
//             tours
//         }
//     })
// }
exports.getTour = factory.getOne(Tour, { path: 'reviews' })
// exports.getTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findById(req.params.id).populate('reviews')
//     if (!tour) {
//         return next(new AppError('No tour found with that id', 404))
//     }
//     res.status(200).json({
//         status: "success",
//         data: {
//             tour
//         }
//     })
// })
exports.createTour = factory.createOne(Tour)
// exports.createTour = catchAsync(async (req, res, next) => {
//     const newTour = await Tour.create(req.body)
//     res.status(201).json({
//         status: 'success',
//         data: { tour: newTour }
//     });
//     // try {
//     // } catch (error) {
//     //     res.status(400).json({
//     //         status: 'fail',
//     //         message: error
//     //     })
//     // }
//     next()
// })
exports.updateTour = factory.updateOne(Tour)
// exports.updateTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//         new: true,
//         runValidators: true
//     })
//     if (!tour) {
//         return next(new AppError('No tour found with that id', 404))
//     }
//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour
//         }
//     })
// })
exports.deleteTour = factory.deleteOne(Tour)
// exports.deleteTour = catchAsync(async (req, res, next) => {
//    const tour =  await Tour.findByIdAndDelete(req.params.id)
//     if (!tour) {
//         return next(new AppError('No tour found with that id', 404))
//     }
//     res.status(204).json({
//         status: 'success',
//         data: null
//     })
// })
exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: { avgPrice: 1 }
        },
        // {
        //     $match:{_id:{$ne:'EASY'}}
        // }
    ])
    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    })
})
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        }, {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: {
                    month: '$startDates'
                },
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        }, {
            $project: {
                _id: 0
            }
        },
        {
            $sort: { numTourStarts: -1 },
        },
        {
            $limit: 12
        }
    ])
    res.status(200).json({
        status: 'success',
        data: {
            plan
        }
    })
})
exports.getsToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params
    const [lat, lng] = latlng.split(',')
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1
    if (!lat || !lng) {
        next(new AppError('please provide latitude and longitude in the format of lat , lng', 400))
    }
    const tours = await Tour.find(
        {
            startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
        })
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours
        }
    })
})
exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params
    const [lat, lng] = latlng.split(',')
    const multiplier = unit === 'mi' ? 0.000621371 : 0.001
    if (!lat || !lng) {
        next(new AppError('please provide latitude and longitude in the format of lat , lng', 400))
    }
    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: 0.001
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ])
    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
    })
})