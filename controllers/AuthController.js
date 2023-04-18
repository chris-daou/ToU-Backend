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

const sendEmail = (email, name, lastname, link) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Email Confirmation',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'Please click on the link to confirm your email.\n\n' + 'Best regards,\n' + link
        };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
          console.log(link);
        }
      });
}

module.exports.singup_post = async (req, res) => {
  const { email, password, name, lastname, nationality, gender, city, phone_number } = req.body;
  const found = await Traveler.findOne({email});
  if(found){
      res.status(400).json(found.type);
      return;
  }
  console.log('hi');
  

  try{
      const user = await User.create({email, password, name, lastname, nationality, gender, phone_number, city, type: "User"});
      const token = createToken(user._id);
      res.cookie('uauthjwt', token, {httpOnly: true, maxAge: maxAge*1000});
      const emailLink = createEmailLink(user._id);
      sendEmail(email, name, lastname, emailLink);
      res.status(201).json({user: user._id});//Send response with 201 status then send back user as json
  }catch(err){
      console.log(err);
      const errors = handleErrors(err);
      res.status(400).json({ errors });
  }//if email and pass were left empty, error would be generated (by mongoose) since they are both required
}

module.exports.login_post = async (req, res) => {
  const { email, password } = req.body;
  try{
      
      const user = await User.login(email, password);
      console.log(user);
      if(user){
          const token = createToken(user._id);
          res.cookie('uauthjwt', token, {httpOnly: true, maxAge: maxAge*1000});//storing the token in the browser
          res.status(200).json({user: user._id, type: user.type});
      }
      else{
          console.log('hi');
          const traveler = await Traveler.findOne({email: email});
          console.log(traveler)
          if(traveler.approved==false){
              res.status(400).json({ message: 'This account has still to be approved by the admin'});
              return;
          }
          const trav = await Traveler.login(email, password);
          if(trav){
              const token = createToken(trav._id);
              res.cookie('tauthjwt', token, {httpOnly: true, maxAge: maxAge*1000});
              res.status(200).json({traveler: trav._id, type: trav.type})
          }
      }
      
  }catch(err){
      const errors = handleErrors(err);
      if(err.message == 'user blocked'){
          res.status(403).json(errors);
      }
      else res.status(400).json({ errors });
  }
}
module.exports.confirmEmail_get = async (req, res) => {
    console.log("hi")
    const id = req.params.id;
    const token = req.params.token;
    const secret = process.env.SECRET_EMAIL;
    const payload = jwt.verify(token, secret);
    if(payload){
        const user = await User.findByIdAndUpdate(id, { valid_e: true }, { new: true });
        console.log(user);
        res.send("Successfully Confirmed Email");
    }
    else res.send("Error Occured");
}

module.exports.logout_get = (req, res) => {
    if (req.cookies.uauthjwt) {
      res.cookie('uauthjwt', '', { maxAge: 1 });
      res.send('User Cookie Deleted');
    } else if (req.cookies.tauthjwt) {
      res.cookie('tauthjwt', '', { maxAge: 1 });
      res.send('Traveler Cookie Deleted');
    } else {
      res.send('No token found to delete');
    }
  };