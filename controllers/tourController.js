const fs = require('fs');
const Tour = require('./../models/tourModel');

const tours= JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

exports.checkBody =(req,res,next)=>{
    if(!req.body.name || !req.name.price){
        return res.status(400).json({
            status:'fail',
            message:'missing name or price'
        })
    }
    next();
}

exports.getAllTours= (req,res)=>{
    console.log(req.time);
    res.status(200).json({
        time_req:req.time,
        status: 'sucess',
        reults: tours.length,
        data : {
            tours 
        }
    })
};

exports.getTour = (req,res)=>{
    console.log(req.params.id);
    const id = req.params.id*1;

    if(id>tours.length){
        return res.status(404).json({
            status:'fail'
        })
    }
    const tour= tours.find(el=> el.id=== id);

    res.status(200).json({
        status: 'sucess',
        data : {
             tour
        }
    })
}

exports.createTour = (req,res)=>{
    //console.log(req.body);
    const newId= tours[tours.length-1].id+1;
    const newTour= Object.assign({id: newId},req.body);
    tours.push(newTour);
    fs.writeFile(
        `${__dirname}/dev-data/data/tours-simple.json`,
        JSON.stringify(tours),
        err=> {
        res.status(201).json({
            status : 'success',
            data:{
                tour:newTour
            }
        })
    })
}

exports.updateTour = (req,res)=>{
    res.status(500).json ({
        satus:'error',
        message:'route is not yet defined'

    })
}
exports.deleteTour = (req,res)=>{
    res.status(500).json ({
        satus:'error',
        message:'route is not yet defined'

    })
}