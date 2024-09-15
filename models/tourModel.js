const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
//const User = require('./userModel');

const tourSchema = new mongoose.Schema({
    name:{
        type:String,
        required :[true,'A tour must have name'],
        unique : true,
        trim:true,
        maxlength:[40, 'characters sholud be less than or equal to 40'],
        minlength:[10,'minimum of 10 characters required']
    },
    slug : String, 
    duration:{
        type:Number,
        required:[true,'A tour must have duration']
    },
    maxGroupSize:{
        type:Number,
        required:[true,'A tour must have grp size']
    },
    difficulty:{
        type: String,
        required:[true,'A tour must have difficulty'],
        enum:{
           values: ['easy','medium','difficult'],
           message : 'Difficulty is either : easy,medium,difficult'

        }
    },
    ratingsAverage:{
        type : Number,
        default : 4.5,
        min : [1, 'rating must be above 1.0'],
        max : [5,'rating must be below 5']
    },
    ratingsQuantity:{
        type:Number,
        default:0
    },
    price:{
        type: Number,
        required : [true,'A tour must have price']
    },
    priceDiscount: {
        
        type: Number,
        validate : {
            validator : function(val){
                // this only points to current document on new doc crreation 
                return val < this.price;
            },
            message : 'discount should be less than regular price'
        }
    },
    summary:{
        type:String,
        trim:true
    },
    description:{
        type:String,
        required:[true,'a tour must have description']
    },
    imageCover:{
        type:String,
        required:[true,'a tour must have cover iamge']
    },
    images:[String],
    createdAt:{
        type: Date,
        default:Date.now(),
        select:false,
    },
    startDates:[Date],
    secretTour : {
        type : Boolean,
        dafault : false
    },
    startLocation:{
        type:{
            type:String,
            default:'Point',
            enum:['Point']
        },
        coordinates : [Number],
        address: String,
        description: String
    },
    locations:[
        {
            type:{
                type: String,
                default:'Point',
                enum:['Point']
            },
            coordinates:[Number],
            address:String,
            description:String,
            day:Number
        }
    ],
    guides:[
        {
            type:mongoose.Schema.ObjectId,
            ref:'User'
        }
    ]
},
{
    toJSON:{virtuals :true},
    toObject:{virtuals:true}
    
});

tourSchema.index({price:1 , ratingsAverage:-1});
tourSchema.index({slug:1});

tourSchema.virtual('duartionWeeks').get(function(){
    return this.duration/7;
})

//Virtual populate
tourSchema.virtual('reviews',{
    ref:'Review',
    foreignField:'tour',
    localField: '_id'
});

//DOCUMENT MIDDLEWARE : runs before .save() and .create() 
tourSchema.pre('save',function (next){
    this.slug= slugify(this.name,{lower:true });
    next();
});

// tourSchema.pre('save',async function (next) {
//     const guidesPromises= this.guides.map(async id=> await User.findById(id));
//     this.guides= await Promise.all(guidesPromises);
//     next();
    
// })

// tourSchema.post('save',function(doc,next){
//     console.log(doc);
//     next();
// })

//QUERY MIDDLEWARE

tourSchema.pre(/^find/,function(next){
    this.find({secretTour:{$ne:true}});
    next();
})

tourSchema.pre(/^find/,function(next){
    this.populate({
        path:'guides',
        select:'-__v -passwordChangedAt'
    })

    next();
})
const Tour= mongoose.model('Tour',tourSchema);

module.exports = Tour;