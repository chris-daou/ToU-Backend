const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Traveler = require('../models/Traveler');
const jwt = require('jsonwebtoken');
const cheerio = require('cheerio');
const request = require('request-promise')
const { requireAuth, checkUser } = require('../middleware/authMiddleware');
const nodemailer = require('nodemailer');
require('dotenv').config();
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

aws.config.update({
    secretAccessKey: process.env.ACCESS_SECRET,
    accessKeyId: process.env.ACCESS_KEY,
    region: process.env.REGION
})
const BUCKET = process.env.BUCKET
const s3 = new aws.S3();

let transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: 'donotreply.tou.lebanon@outlook.com', // your email address
      pass: '*31&pCbE' // your email password
    }
  });

  module.exports.accept_order = async (req, res) => {
    const travelerId = req.params.id;
    const orderId = req.params.id;
    try {
        const traveler = await Traveler.findById(travelerId);
        const order = await Order.findById(orderId);

        if(order.status == 1 && order.waiting_resp == true) {
            traveler.assigned_orders.push(orderId); // add the order to the assigned_orders array
            order.status = 2;
            order.waiting_resp = false;
            await order.save();
            await traveler.save(); // save the updated traveler object to the database
        }

        res.status(200).json({ message: 'Order assigned successfully' });
    } catch (err) {
        res.status(400).json({ message: 'Failed to assign order' });
    }
}

module.exports.reject_order = async (req, res) => {
    const travelerId = req.params.id;
    const orderId = req.params.id;
    try {
        const traveler = await Traveler.findById(travelerId);
        const order = await Order.findById(orderId);
        if(order.status == 1 && order.waiting_resp == true) {
            traveler.assigned_orders.push(orderId); // add the order to the assigned_orders array
            order.waiting_resp = false;
            await order.save();
            await traveler.save(); // save the updated traveler object to the database
        }
        res.status(200).json({ message: 'Order rejected' });
    } catch (err) {
        res.status(400).json({ message: 'Failed to assign order' });
    }
}