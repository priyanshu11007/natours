const mongoose = require('mongoose');
const app = require('./app');
const dotenv = require('dotenv');


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


const port= 3000;
app.listen(port, ()=>{
    console.log(`app running on the port ${port}`);
})

console.log(process.env); 