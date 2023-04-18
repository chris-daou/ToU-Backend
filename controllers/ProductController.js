const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const cheerio = require('cheerio');
const request = require('request-promise')
const { requireAuth, checkUser } = require('../middleware/authMiddleware');
const nodemailer = require('nodemailer');
const { copy } = require('../routes/AdminRoute');





let transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: 'donotreply.tou.lebanon@outlook.com', // your email address
      pass: '*31&pCbE' // your email password
    }
  });
  
  
  const sendDecisionEmail = (email, name, lastname, title, result) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Email Confirmation',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to inform you that your order:\n'+ title + '\nhas been ' + result + '.'
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



  function getProdId(s) {
    for (var i = 0; i < s.length; i++) {
      let startIndex;
      let endIndex;
      if (
        s.charAt(i) == "/" &&
        s.charAt(i + 1) == "d" &&
        s.charAt(i + 2) == "p"
      ) {
        startIndex = i + 4;
        endIndex = startIndex + 10;
        return s.substring(startIndex, endIndex);
      }
    }
  }