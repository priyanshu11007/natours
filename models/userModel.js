const mongoose = require('mongoose');
const validator= require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

//name, email,photo,password,confirm password
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required :[true,'A user must have name'],
        trim:true,
        maxlength:[40, 'characters sholud be less than or equal to 40'],
        minlength:[10,'minimum of 10 characters required']
    },
    email:{
        type:String,
        required: [true,'user must have email'],
        unique : [true,'already registered email'],
        lowercase: true,
        validate :[validator.isEmail,'Please provide a valid email']
    },
    photo : {
        type: String,
    },
    role:{
        type:String,
        enum:['user','guide','lead-guide','admin'],
        default:'user'
    },
    password :{
        type:String,
        required : [true,'Please provide a password'],
        minlength : 8,
        select:false
    },
    passwordConfirm:{
        type : String,
        required :[true,'Please confirm your password'],
        validate: {
            //works only on save and create
            validator : function (el) {
                return el===this.password;
            },
            messaege : 'password and confirm password are not same'
        }
    },
    passwordChangedAt : Date,

    passwordResetToken :{
        type:String,
    },
    passwordResetExpires:{
        type:Date
    },
    active :{
        type : Boolean,
        boolean: true,
        select : false
    }
});

userSchema.pre('save',async function (next) {
    if(!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password,12)

    this.passwordConfirm= undefined;
    next();
})

userSchema.pre('save',function(next){
    if(!this.isModified('password')|| this.isNew) return next();

    this.passwordChangedAt= Date.now()-1000;
    next();
})
 
userSchema.pre(/^find/, function(next){
    this.find({active:{$ne: false}}); 
    next();
})

userSchema.methods.correctPassword = async function(candidatePassword,userPassword){
    return await bcrypt.compare(candidatePassword,userPassword);
}

userSchema.methods.changePasswordAfter = function(JWTTimestamp){
    if(this.passwordChangedAt){
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime()/1000,10); 
        console.log(changedTimeStamp,JWTTimestamp); 
        return JWTTimestamp< changedTimeStamp; 
    }

    return false;
}

userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');

   
    this.passwordResetToken= crypto.createHash('sha256').update(resetToken).digest('hex');

    this.passwordResetExpires= Date.now()+10*60*1000;


    return resetToken;
}

const User = mongoose.model('User',userSchema)

module.exports = User; 