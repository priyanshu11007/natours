const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/email');
const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// const createSendToken = (user,statusCode,res)=>{
//     const token = signToken(user._id);

//     res.cookie('jwt',token,cookieOptions);

//     res.status(statusCode).json({
//         status :"success",
//         token
//     });
// }

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  const token = signToken(newUser._id);
  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  });
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.status(201).json({
    status: 'success',
    token,
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('please provide email and password', 400));
  }

  const user = await User.findOne({ email: email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('incorrect email or password', 401));
  }

  const token = signToken(user._id);
  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  });
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.status(200).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
});


exports.logout = (req,res)=>{
  res.cookie('jwt','loggedout',{
    expires : new Date(Date.now()+10*1000),
    httpOnly:true
  });
  res.status(200).json({status : 'success'});
}

exports.protect = catchAsync(async (req, res, next) => {
  // 1) getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in, Please log in'));
  }
  // 2) Verification Token
  const decoded = await jwt.verify(token, process.env.JWT_SECRET);
  console.log(decoded);

  // 3)check if user still exists
  const freshUser = await User.findById(decoded.id);
  console.log('freshUser', freshUser);
  if (!freshUser) {
    return next(new AppError('the user no longer exists', 401));
  }
  // 4) if password is changed or  not

  if (freshUser.changePasswordAfter(decoded.iat)) {
    return next(new AppError('password changed, login again', 401));
  }
  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = freshUser;
  res.locals.user=freshUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  // 1) getting token and check of it's there
  try{
  if (req.cookies.jwt) {
    const decoded = await jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);

    // 3)check if user still exists
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
      return next();
    }
    // 4) if password is changed or  not

    if (freshUser.changePasswordAfter(decoded.iat)) {
      return next();
    }
    // GRANT ACCESS TO PROTECTED ROUTE
    res.locals.user=freshUser;
     return next();
  }
}catch(err){
  return next();
}
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin','lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1)get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user with this email', 404));
  }
  //2) generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `forgot your password , don't worry, submit a patch request to ${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'your password reset token (valid for 10  min)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'token sents to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('error sending email, try later', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2
  if (!user) {
    return next(new AppError('token is invalid', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3
  const token = signToken(user._id);
  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  });
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.status(201).json({
    status: 'success',
    token,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1 ) get user from collection

  const user = await User.findById(req.user.id).select('+password');

  console.log(user);
  //2) check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('your current password is wrong', 401));
  }

  // 3) if so, update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) log in user, send jwt
  const token = signToken(user._id);
  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  });
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.status(200).json({
    status: 'success',
    token,
  });
});
