const path = require('path');
const express = require('express');
const app= express();
const { request } = require('http');
const morgan= require('morgan');
const AppError = require('./utils/appError');
const globalErrorHandler= require('./controllers/errorController');
const tourRouter= require('./routes/tourRoutes');
const userRouter= require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

app.set('view engine','pug');
app.set('views',path.join(__dirname,'views'))
 




// GLOBAL MIDDLEWARES

//serving static fiels
//app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname,'public')));


// set security http
app.use(helmet()); 

app.use(morgan('dev'));

// set limit
const limiter= rateLimit({
    max:100,
    windowMs: 60*60*1000,
    message:'too many messages from this ip, retry in an hour'
});

app.use('/api',limiter);


// body parser,reading data from body into req.body
app.use(express.json({limit : 'n10kb'}));


// data sanitization against nosql query injection
app.use(mongoSanitize());
// data injection against XSS
app.use(xss()); 


//prevent parameter pollution
app.use(hpp({
    whitelist:[
        'duration','ratingsQuantity','ratingsAverage','maxGroupSize','difficulty','price'
    ]
}))



//test middleware
app.use((req,res,next)=>{
    req.time = new Date().toISOString();
    next();
})

//routes
app.get('/',(req,res)=>{
    res.status(200).render('base',{
        tour:'THE FOREST HIKER',
        name: 'Priyanshu'
    })
})
app.use('/api/v1/tours',tourRouter);
app.use('/api/v1/users',userRouter);
app.use('/api/v1/reviews',reviewRouter);


app.all('*',(req,res,next)=>{
    next(new AppError(`cannot find ${req.originalUrl} on this server`,404));
    })


app.use(globalErrorHandler);

module.exports = app; 