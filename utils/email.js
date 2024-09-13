const nodemailer = require('nodemailer');

const sendEmail = async options =>{
    
    // 1) create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: 25,
        auth:{
            user : process.env.EMAIL_USERNAME,
            pass : process.env.EMAIL_PASSWWORD
        }
    });

    // define email options

    const mailOptions ={
        from : 'priyadarshi6982@gmail.com',
        to:options.email,
        subject:options.subject,
        text:options.message,
    }

    // transporter
    await transporter.sendMail(mailOptions);
    console.log("email sent");


};

module.exports = sendEmail;