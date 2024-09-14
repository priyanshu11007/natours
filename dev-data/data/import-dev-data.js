const mongoose = require('mongoose');
const fs= require('fs');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
const { dirname } = require('path');


dotenv.config({path : './config.env'});

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

mongoose. 
    connect(DB,{
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,

    })
    .then(()=> console.log("DB Connection sucessful"));

    //READ JASON FILE

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`,'utf-8'));

//import data in db

const importData = async ()=>{
    try{
        await Tour.create(tours);
        console.log("data loaded");
    }catch(err){
        console.log(err);
    }
    process.exit();
}
const deleteData = async ()=>{
    try{
        await Tour.deleteMany();
        console.log("data deleted");
    }catch(err){
        console.log(err);
    }
    process.exit();
}
if(process.argv[2]==='--import'){
    importData();
}
else if(process.argv[2]==='--delete'){
    deleteData();
}

console.log(process.argv);


