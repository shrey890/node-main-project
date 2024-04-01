const express = require('express')
const app = express()
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const hpp = require('hpp')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const userRouter = require('./routes/userRoutes')
const tourRouter = require('./routes/tourRoutes')
const reviewRouter = require('./routes/reviewRoutes')
const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')
//  * body parser  , reading data from body into req.body
app.use(express.json({ limit: '10kb' }))
//  * set security HTTP headers
app.use(helmet())
//  development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}
//  limit requires from same api
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'too many request from the IP, please try again in hour!'
})
app.use('/api', limiter)
// data sanitization against noSQL query injection
app.use(mongoSanitize())
// data sanitization against XSS
app.use(xss())
//  * prevent parameter pollution
app.use(hpp({
    whitelist: ['duration','difficulty','price','maxGroupSize','ratingsAverage','ratingsQuantity']
}))
//  * serving static file
app.use(express.static(`${__dirname}/public`))
//  * test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString()
    next()
})
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)
app.all('*', (req, res, next) => {
    // res.status(404).json({
    //     status: 'route failed',
    //     message: `can't find ${req.originalUrl} on this server!`
    // })
    // const err = new Error(`Can't find ${req.originalUrl} on this server`)
    // err.status = 'fail',
    // err.statusCode = 404
    next(new AppError(`Can't find ${req.originalUrl} on this server`))
})
app.use(globalErrorHandler)
module.exports = app