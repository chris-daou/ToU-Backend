const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Traveler = require('../models/Traveler');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();
const bcrypt = require('bcrypt');
const cheerio = require('cheerio');
const request = require('request');
const Feedback = require('../models/Feedback');

let transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: 'donotreply.tou.lebanon@outlook.com', // your email address
      pass: '*31&pCbE' // your email password
    }
});

const sendCompletiontoTraveler = async (email, name, lastname, pname) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Order Completed!',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that you successfully delivered:\n'+ pname +'\nhas been acquired by the client!. \n' + 'Best regards,\n'
        };
        await new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    reject(error);
                } else {
                    console.log('Email sent: ' + info.response);
                    console.log(link);
                    resolve();
                }
            });
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
    const clientId = req.userId;
    const client = await User.findById(clientId);
    const token = req.nat;
    if(client){
        try{
            const list = client.pending_orders;
            const list1 = []
            for(let i = 0; i < list.length; i++){
                const order = await Order.findById(list[i])
                const product = await Product.findById(order.item)
                const obj = {order, product}
                list1.push(obj)
            }
            res.status(200).send([{porders: list1, token}]);
        }catch(err){
            console.log(err);
        }
    }else{
        res.status(404).json( { message: 'Client Not Found'})
    }
}

module.exports.getActiveClient_get = async (req, res) => {
    const clientId = req.userId;
    const client = await User.findById(clientId);
    const token = req.nat;
    if(client){
        try{
            const list = client.active_orders;
            const list1 = []
            for(let i = 0; i < list.length; i++){
                const order = await Order.findById(list[i])
                const product = await Product.findById(order.item)
                const obj = {order, product}
                list1.push(obj)
            }
            res.status(200).json( [{aorders: list1,token}]);
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

module.exports.complete_order_post = async (req, res) => {
    const clientId = req.user._id;
    const client = User.findById(clientId);
    const orderId = req.params.orderid;
    const order = Order.findById(orderId);

    if(client && order && client.active_orders.includes(orderId) && order.status==6){
        try{
            order.status = 7;
            const travelerId = order.traveler;
            const traveler = await Traveler.findById(travelerId);
            const prodId = order.title;
            const prod = await Product.findById(prodId);

            let index = traveler.assigned_orders.indexOf(orderId);
            if (index !== -1) {
                traveler.new_orders.splice(index, 1);
            }
            traveler.completed_orders.push(orderId);
            let indexc = client.active_orders.indexOf(orderId);
            if (indexc !== -1) {
                client.active_orders.splice(index, 1);
            }
            client.completed_orders.push(orderId);
            await client.save();
            await traveler.save();
            sendCompletiontoTraveler(traveler.email, traveler.name, traveler.lastname, prod.title);

            res.status(200).json( {message: 'Successfully Comepleted Order'});
        }catch(err){
            console.log(err);
        }
    }else{
        res.status(404).json( { message: 'Client or Order Not Found'})
    }
}

module.exports.getProfile = async (req, res) => {
    const clientId = req.userId;
    const client = await User.findById(clientId);
    if(client){
        res.status(200).json( {client} );
    }
    res.status(400).json( {message: 'Something went wrong'} )
}

module.exports.editProfile = async (req, res) => {
    const clientId = req.user._id;
    const client = await User.findById(clientId);
    if(client){
        try {
            const user = await User.findByIdAndUpdate(clientId, req.body, { new: true });
            res.send(user);
          } catch (error) {
            res.status(500).send(error);
          }
    }else{
        res.status(500).send(error);
    }
}

module.exports.changePass_post = async (req, res) => {
    const password = req.body.password;
    const clientId = req.user._id;
    const client = await User.findById(clientId);
    if(client){
        try{
            bcrypt.genSalt(10, function(err, salt){
                if(err){
                    console.log(err);
                    res.status(500).json({message: 'Server Occured'});
                    return;
                }
                bcrypt.hash(pass2, salt, async function(err, hash){
                    client.password = hash;
                    client.save();
                    res.status(200).json({message: 'Successfully changed password'});
                })
            })
        }catch(err){
            console.log(err);
            res.status(500).json({message: 'Server Occured'});
    }
}
}

module.exports.getRate_get = async (req, res) => {
    try{
    const options = {
        url: "https://lirarate.org/",
        gzip: true,
      };
      request(options, function(err, res1, html){
        let $ = cheerio.load(html);
        
        const buyrate = $("p[id='latest-buy']").text().trim();
        const rate = buyrate.replace(/\D/g, '').substring(1);
        
        console.log(rate);
        res.send({rate: rate});
        });
    }
    catch(err){
        console.log(err);
        res.status(400).send({ error: 'Error Occured' });
    }
}

module.exports.giveFeedback_post = async(req, res) => {
    const orderId = req.params.orderid;
    const order = await Order.findById(orderId);
    const { rating, arrived_on_time, as_described, good_service, message } = req.body;
    if (order){
        try{
            const feedback = await Feedback.create({order: orderId, rating, arrived_on_time, as_described, good_service, message});
            order.feedback = feedback._id;
            await order.save();
            res.status(201).json({message: 'Feedback added successfully'});
        }
        catch(err){
            console.log(err);
            res.status(500).json({message: 'Server Error Occured'});
        }
    }
    else{
        res.status(404).json({message: 'Order not Found.'})
    }
}
