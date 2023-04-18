const User = require('../models/User');
const Traveler = require('../models/Traveler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: 'donotreply.tou.lebanon@outlook.com', // your email address
      pass: '*31&pCbE' // your email password
    }
  });


  const sendEmail = (email, name, lastname, link) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Password Change',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'Please click on the link to change your password.\n\n' + 'Best regards,\n' + link
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

module.exports.fp_post = async (req, res) => {
    const email = req.body.email;
    console.log(email);
    if(email!=null){
        let user = await User.findOne({email: email});
        if(!user) {
            user = await Traveler.findOne({email: email});
        }
        console.log(user);
        if(!user) res.send("Email does not exist.");
        const secret = process.env.SECRET_JWT + user.password;
        const payload = {
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        id: user._id,
        type: user.type
        }
        const token = jwt.sign(payload, secret, {expiresIn: '15m'});
        const link = 'http://localhost:5000/reset-password/'+user._id+"/"+token;
        sendEmail(payload.email, payload.name, payload.lastname, link);
        console.log(link);
        console.log(payload);
        res.send("Reset link has been sent ");
    }
}

module.exports.rp_get = async (req, res) => {
    const id = req.params.id;
    const token = req.params.token;
    console.log(id);
    const user = await User.findById(id);
    if(user){
        console.log(user);
        const secret = process.env.SECRET_JWT + user.password;
        try{
            const payload = jwt.verify(token, secret);
            if(payload) res.status(200).json(payload);
            else{
                res.status(400).json({error: "Something went wrong"});
            }
        }catch(err){
            console.log(err);
        }
    }
    else{
        res.send("Oops something went wrong")
    }
}

module.exports.rp_post = async (req, res) => {
    const id = req.params.id;
    const token = req.params.token;
    const pass = req.body.password;
    const pass2 = req.body.password2;
    console.log(id);
    const user = await User.findById(id);
    if(user){
        console.log(user);
        const secret = process.env.SECRET_JWT + user.password;
        try{
            const payload = jwt.verify(token, secret);
            if(payload){
                if(pass===pass2){
                    bcrypt.genSalt(10, function(err, salt){
                        bcrypt.hash(pass2, salt, async function(err, hash){
                            if(payload.type == "User"){
                                await User.findOneAndUpdate(
                                    { email: user.email },
                                    { password: hash }
                                );
                            }
                            else if(payload){
                                await Traveler.findOneAndUpdate(
                                    { email: user.email },
                                    { password: hash }
                                )
                            }
                            res.send("Successfully changed Password");
                        })
                    })
                }else{
                    res.send("The password and its confirmation do not match");
                }
            }else{
                res.send("Payload Time Expired.")
            }
        }catch(err){
            console.log(err);
        }
    }
    else{
        console.log("Something went wrong.. Oops!")
    }
}
