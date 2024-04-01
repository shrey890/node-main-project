const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError")
const catchAsync = require("../utils/catchAsync")
exports.deleteOne = Model =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);
        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }
        res.status(204).json({
            status: 'success',
            data: null
        });
    });
exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })
    if (!doc) {
        return next(new AppError('No doc found with that id', 404))
    }
    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    })
})
exports.createOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body)
    res.status(201).json({
        status: 'success',
        data: { data: doc }
    });
    // try {
    // } catch (error) {
    //     res.status(400).json({
    //         status: 'fail',
    //         message: error
    //     })
    // }
    next()
})
exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id)
    if (popOptions) query = query.populate(popOptions)
    const doc = await query
    if (!doc) {
        return next(new AppError('No doc found with that id', 404))
    }
    res.status(200).json({
        status: "success",
        data: {
            data: doc
        }
    })
})
exports.getAll = Model => catchAsync(async (req, res, next) => {
    // ! build query
    // const queryObj = { ...req.query }
    // const excludeFields = ['page', 'sort', 'limit', 'fields']
    // excludeFields.forEach(el => delete queryObj[el])
    // let queryStr = JSON.stringify(queryObj)
    // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)
    // let query = Tour.find(JSON.parse(queryStr));
    // const tours = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy')
    //    ? 2) sorting
    // if (req.query.sort) {
    //     const sortBy = req.query.sort.split(',').join(' ')
    //     query = query.sort(sortBy)
    // } else {
    //     query = query.sort('-createdAt')
    // }
    // ? 3) field limiting
    // if (req.query.field) {
    //     const fields = req.query.fields.split(',').join(' ')
    //     query = query.select(fields)
    // } else {
    //     query = query.select('-__v')
    // }
    // ? 4) pagination
    // const page = req.query.page * 1 || 1
    // const limit = req.query.limit * 1 || 100
    // const skip = (page - 1) * limit
    // query = query.skip(skip).limit(limit)
    // if (req.query.page) {
    //     const numTours = await Tour.countDocuments()
    //     if (skip >= numTours) {
    //         throw new Error('this page does not exist')
    //     }
    // }
    // ! to allow for nested GET reviews on tour(hack)
    let filter = {}
    if (req.params.tourId) filter = { tour: req.params.tourId }
    // ! execute query
    const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().paginete()
    // const doc = await features.query.explain()
    const doc = await features.query
    // ! send response
    res.status(200).json({
        status: "success",
        result: doc.length,
        data: {
            data: doc
        }
    })
})