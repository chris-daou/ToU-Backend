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



  function extractProductInfo(str) {
    let weight = -1;
    let length = -1;
    let width = -1;
    let height = -1;

    // Extract weight
    const weightRegex = /(\d+(\.\d+)?)\s*(pounds|lb|lbs|ounces|oz)/i;
    const weightMatch = str.match(weightRegex);
    if (weightMatch) {
        weight = parseFloat(weightMatch[1]);
        if (weightMatch[3].toLowerCase() === 'ounces' || weightMatch[3].toLowerCase() === 'oz') {
            weight /= 16;
        }
    }

    // Extract dimensions
    const dimensionsRegex = /(\d+(\.\d+)?)\s*x\s*(\d+(\.\d+)?)\s*x\s*(\d+(\.\d+)?)\s*(inches|in)/i;
    const dimensionsMatch = str.match(dimensionsRegex);
    if (dimensionsMatch) {
        length = parseFloat(dimensionsMatch[1]);
        width = parseFloat(dimensionsMatch[3]);
        height = parseFloat(dimensionsMatch[5]);
    }

    return "Weight: " + weight + " Length: " + length + " Width: " + width + " Height: " + height;
}