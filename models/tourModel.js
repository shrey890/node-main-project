const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')
const User = require('./userModel')
// const User = require('./userModel')
const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, 'a tour must have a name'],
        unique: true,
        maxLength: [40, 'A tour name must have less or equal then 40 characters'],
        minLength: [10, 'A tour name must have more or equal then 10 characters'],
        // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    duration: {
        type: Number,
        required: [true, 'a tour must have a duration'],
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'a tour must have a max group size'],
    },
    difficulty: {
        type: String,
        trim: true,
        required: [true, 'a tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'difficulty is either: easy , medium or difficulty'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'rating must be above 1'],
        max: [5, 'rating must be below 5'],
        set: val => Math.round(val * 10) / 10
    },  
    slug: String,
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'a tour must have a price'],
    },
    priceDiscount: {
        type: Number,
        validate: function (val) {
            return val < this.price
        },
        message: 'discount price ({VALUE}) should be below regular price'
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a Summary'],
    },
    description: {
        type: String,
        trim: [true, 'A tour must have a Description'],
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a Image']
    },
    image: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false,
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    location: [
        {
            type: {
                type: String,
                default: 'point',
                enum: ['point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number,
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
        }
    ],
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
}
)
tourSchema.index({ price: 1, ratingsAverage: -1 })
tourSchema.index({ slug: 1 })
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7
})
//  virtual populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
})
// ! DOCUMENT MIDDLEWARE: runs before .save() and .create() 
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true })
    next()
})
tourSchema.pre('save', async function (next) {
    const guidesPromises = this.guides.map(async id => await User.findById(id))
    this.guides = await Promise.all(guidesPromises)
    next()
})
// tourSchema.pre('save',function (next) {
//     console.log('will save doc...  ')
//     next()
// })
// tourSchema.post('save', function (doc, next) {
//     console.log(doc)
//     next()
// })
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } })
    this.start = Date.now()
    next()
})
tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v-passwordChangedAt'
    })
    next()
})
tourSchema.post(/^find/, function (docs, next) {
    console.log(`Query took ${Date.now() - this.start} milliseconds`)
    // console.log(docs)
    next()
})
// ! aggregation middleware
tourSchema.pre('aggregate', function (next) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })
    console.log(this.pipeline())
    next()
})
const Tour = mongoose.model('Tour', tourSchema)
module.exports = Tour