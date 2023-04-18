//these are handle functions
const User = require('../models/User');
const Traveler = require('../models/Traveler');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();


let transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: 'donotreply.tou.lebanon@outlook.com', // your email address
      pass: '*31&pCbE' // your email password
    }
  });

  const handleErrors = (err) => {
    //console.log(err.message, err.code);//err.code is for the user
    let errors = {
        email: '', password: ''
    }//populate this with an email error and a password error from 'err' (check in terminal)
    //incorrect email
    if(err.message === 'incorrect email'){
        errors.email = 'that email is not registered'
    }
    //Unverified email
    if(err.message === 'email not verified'){
        errors.email = 'email is not verified'
    }
    //incorrect password
    if(err.message === 'incorrect password'){
        errors.password = 'that password is incorrect';
    }
    //account blocked
    if(err.message === 'user blocked'){
        errors.email = 'This account has been freezed due to excess of failed login attempts. Try again later.'
        return errors;
    }
    //duplicate error code
    if(err.code===11000){
        errors.email = 'that email is already registered';
        return errors;
    }
    //validation errors
     if(err.message.includes('user validation failed')){
        //console.log(err); in the terminal, an error object will be returned, this is the object we want to tackle
        //console.log(Object.values(err.errors))//Object.values is used to only get the values of specified attribute that will be inside the 'properties' field.
        
        Object.values(err.errors).forEach(({properties}) => {   //similar to forEach(err) then err.properties
            errors[properties.path] = properties.message;
        })   
    }
    return errors;
}

const maxAge = 3*24*60*60;
const createToken = (id) => {
    return jwt.sign({ id }, process.env.SECRET_JWT, {
        expiresIn: maxAge
    })
}

const createEmailLink = (id) => {
    const emailToken = jwt.sign({id}, process.env.SECRET_EMAIL, {expiresIn: '2d'});
    const link = "http://localhost:5000/confirm-email/"+id+"/"+emailToken;
    return link;
}