const AppError = require('../utils/appError')
const handleCastErrorDB = err => {
    const message = `Invalid ${err.path} : ${err.value}`
    return new AppError(message, 400)
}
const handleDuplicateFieldDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0]
    console.log(value)
    const message = `duplicate field value:${value} please use another value!`
    return new AppError(message, 400)
}
const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message)
    const message = `invalid input data.${errors.join('. ')}`
    return new AppError(message, 400)
}
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    })
}
const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        })
    } else {
        console.error(err);
        res.status(500).json({
            status: 'failed',
            message: 'something went very wrong'
        })
    }
}
const handleJsonWebTokenErrorDB = (err) => {
    new AppError('Invalid token. please log in again', 401)
}
const handleTokenExpiredErrorDB = (err) => {
    new AppError('Token expired', 401)
}
module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.status = err.status || 'error'
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res)
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err }
        if (error.name === 'CastError') {
            error = handleCastErrorDB(error)
        }
        if (error.code === 11000) error = handleDuplicateFieldDB(error)
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error)
        if (error.name === 'JsonWebTokenError') error = handleJsonWebTokenErrorDB(error)
        if (error.name === 'TokenExpiredError') error = handleTokenExpiredErrorDB(error)
        sendErrorProd(error, res)
    }
    next()
}