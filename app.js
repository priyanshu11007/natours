const express = require('express');
const app= express();
const { request } = require('http');
const morgan= require('morgan');

const tourRouter= require('./routes/tourRoutes');
const userRouter= require('./routes/userRoutes');


// MIDDLEWARES

app.use(morgan('dev'));

app.use(express.json());

app.use(express.static(`${__dirname}/public`));

app.use((req,res,next)=>{
    req.time = new Date().toISOString();
    next();
})


app.use('/api/v1/tours',tourRouter);
app.use('/api/v1/users',userRouter);

module.exports = app; 