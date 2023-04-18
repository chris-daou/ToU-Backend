const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Traveler = require('../models/Traveler');
const jwt = require('jsonwebtoken');
const { requireAuth, checkUser } = require('../middleware/authMiddleware');
const nodemailer = require('nodemailer');
require('dotenv').config();
const bcrypt = require('bcrypt');

let transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: 'donotreply.tou.lebanon@outlook.com', // your email address
      pass: '*31&pCbE' // your email password
    }
});

const sendCompletiontoTraveler = (email, name, lastname, pname) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Order Completed!',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that you successfully delivered:\n'+ pname +'\nhas been acquired by the client!. \n' + 'Best regards,\n'
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

module.exports.confirm_order_get = async (req, res) => {
    const token = req.params.token;
    const orderId = req.params.orderid;
    const secret = process.env.SECRET_CONFIRM_ORDER;
    const payload = jwt.verify(token, secret);
    if(payload){
        try{
            const order = await Order.findById(orderId);
            console.log(order)
            if(order.status == 1 && order.traveler!=null){
                order.client_confirmed = true;
                order.status = 2;
                order.save().then(console.log(order));
                res.status(200).json( {message: 'Successfully Confirmed Order'});
            }else{
                res.status(400).json({ message: 'Order has not yet been approved by an admin'});
                
            }
        }catch(err){
            console.log(err);
        }
    }
    else res.status(404).json( {message: 'Confirmation Date Expired'});
}

module.exports.getPendingClient_get = async (req, res) => {
    const clientId = req.user._id;
    const client = await User.findById(clientId);

    if(client){
        try{
            const list = client.pending_orders;
            res.status(200).json( {porders: list});
        }catch(err){
            console.log(err);
        }
    }else{
        res.status(404).json( { message: 'Client Not Found'})
    }
}

module.exports.getActiveClient_get = async (req, res) => {
    const clientId = req.user._id;
    const client = await User.findById(clientId);

    if(client){
        try{
            const list = client.active_orders;
            res.status(200).json( {aorders: list});
        }catch(err){
            console.log(err);
        }
    }else{
        res.status(404).json( { message: 'Client Not Found'})
    }
}

module.exports.getActiveOrder_get = async (req, res) => {
    const clientId = req.user._id;
    const client = await User.findById(clientId);
    const orderId = req.params.orderid;
    const order = await Order.findById(orderId);

    if(client && order && client.active_orders.includes(orderId)){
        try{
            const status = order.status;
            res.status(200).json( {status});
        }catch(err){
            console.log(err);
        }
    }else{
        res.status(404).json( { message: 'Client or Order Not Found'})
    }
}