// review /rating/createdAt/ ref to tour /ref to user

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    review:{
        type:String,
        rerquired:[true,'review can be empty']
    },
    rating:{
        type:Number,
        min:1,
        max:5
    },
    createdAt:{
        type:Date,
        default:Date.now()
    },
    tour:{
        type:mongoose.Schema.ObjectId,
        ref:'Tour',
        required:[true,'A review must belong to a tour']
    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:[true,'a user must be there for review']
    }, 
},
{
    toJSON:{virtuals :true},
    toObject:{virtuals:true}
    
}
);

reviewSchema.pre(/^find/,function(next){
    // this.populate({
    //     path:'tour',
    //     select:'name'
    // }).populate({
    //     path:'user',
    //     select : 'name'
    // })

    this .populate({
        path:'user',
        select : 'name'
    })
    next();
})

const Review= mongoose.model('Review', reviewSchema);

module.exports = Review;


 