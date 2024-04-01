const User = require("../models/userModel");
const { promisify } = require('util')
const AppError = require('../utils/appError')
const catchAsync = require("../utils/catchAsync");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}
const createSandToken = (user, statusCode, res) => {
    const token = signToken(user._id)
    const cookieOptions = {
        expires: new (Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly:true
    }
    if(process.env.NODE_ENV==='production')cookieOptions.secure = true
    res.cookie('jwt', token, cookieOptions)
    user.password =undefined
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}
exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body)
    createSandToken(newUser, 201, res)
    // const newUser = await User.create({
    //     name: req.body.name,
    //     email: req.body.email,
    //     password: req.body.password,
    //     passwordConfirm: req.body.passwordConfirm
    // })
    // const token = signToken(newUser._id)
    // res.status(201).json({
    //     status: 'success',
    //     token,
    //     data: {
    //         user: newUser
    //     }
    // })
})
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body
    // ? Check if email and password exist
    if (!email || !password) {
        return next(new AppError('please provide email and password ', 400))
    }
    //  ? check if user exist && password is correct
    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401))
    }
    // ? if everything ok send token to client
    createSandToken(user, 200, res)
})
exports.protect = catchAsync(async (req, res, next) => {
    let token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    }
    if (!token) {
        return next(new AppError('you are not logged in! please login to get access. ', 401))
    }
    //  * 2) verify token
    const decoded = await promisify(jwt.verify(token, process.env.JWT_SECRET))
    //  * 3) check if user still exists
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
        return next(new AppError('user dose not longer exist', 401))
    }
    // * 4) check if user changed password after the token was issued
    if (currentUser.changesPasswordAfter(decoded.iat)) {
        return next(new AppError('user recently changed password! please login again. ', 401))
    }
    //  * 5) grant access to protected route
    req.user = currentUser
    next()
})
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('you do not have permission to perform this action', 403))
        }
        next()
    }
}
exports.forgotPassword = catchAsync(async (req, res, next) => {
    // * 1) Get user based on posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('there is no user with this email ', 404))
    }
    // * 2) generate the random reset token
    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false })
    // * 3) send it to user email
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/reserPassword/${resetToken}`
    const message = `Forget your password? Submit a PATCH request with new password and passwordConfirm to: ${resetUrl}.\nif you dind't forget your password , pleasse ignore this email`
    try {
        await sendEmail({
            email: user.email,
            subject: 'your password reset token(valid for 10 minutes)',
            message
        })
        res.status(200).json({
            status: 'success',
            message: 'token sent to email successfully'
        })
    }
    catch (err) {
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save({ validateBeforeSave: false })
        return next(new AppError('there was an error sending token to email try again later '), 500)
    }
})
exports.resetPassword = catchAsync(async (req, res, next) => {
    // * 1) get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } })
    // * 2) if token not expired and there is user  , set the new password
    if (!user) {
        return next(new AppError('token is invalid or expired', 400))
    }
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()
    // * 3) update changedPasswordAt property for the user
    // * 4) log the user in , send JWT 
    createSandToken(user, 200, res)
})
exports.updatePassword = catchAsync(async (req, res, next) => {
    // * 1) get user from collections
    const user = await User.findById(req.user.id).select(+password)
    // * 2) check if  posted current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('your current password is wrong ', 401))
    }
    // * 3) if so , update password
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    await user.save()
    // User.findByIdAndUpdate   
    // * 4) log user in ,send JWT
    createSandToken(user, 200, res)
})