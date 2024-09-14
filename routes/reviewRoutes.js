
const express = require('express');
const reviewController = require('../controllers/reviewController');
const router= express.Router({ mergeParams:true});

const authController= require('./../controllers/authController');

router.use(authController.protect);

router.route('/')
        .get(reviewController.getAllReviews)
        .post( authController.restrictTo('user'),reviewController.setTourUserIds, reviewController.createReview);



router.route('/:id')
    .get(reviewController.getReview)
    .delete(authController.restrictTo('admin','user'),reviewController.deleteReview)
    .patch(authController.restrictTo('admin','user'),reviewController.updateReview);
    
     
module.exports = router;
