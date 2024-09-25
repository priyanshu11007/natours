const path = require('path');
const express = require('express');
const app = express();
const { request } = require('http');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const { title } = require('process');
const viewRouter = require('./routes/viewRoutes');
const cookieParser= require('cookie-parser');
const cors = require('cors');
const compression = require('compression');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// GLOBAL MIDDLEWARES

//serving static fiels
//app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// set security http
app.use(helmet());

app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "http://127.0.0.1:3000", "ws://127.0.0.1:64568"], // Allow API calls to 127.0.0.1
        // Other directives can go here, e.g. for scripts, images, etc.
      },
    })
  );

app.use(morgan('dev'));

// set limit
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'too many messages from this ip, retry in an hour',
});

app.use('/api', limiter);

// body parser,reading data from body into req.body
app.use(express.json({ limit: 'n10kb' }));

app.use(cookieParser());



// data sanitization against nosql query injection
app.use(mongoSanitize());
// data injection against XSS
app.use(xss());

//prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(compression());

//test middleware
app.use((req, res, next) => {
  req.time = new Date().toISOString();
  //console.log(req.cookies);
  next();
});

//routes

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`cannot find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
