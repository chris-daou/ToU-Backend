const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Traveler = require('../models/Traveler');
const jwt = require('jsonwebtoken');
const { requireAuth, checkUser } = require('../middleware/authMiddleware');
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


  const sendProofEmailApproved = (email, name, lastname) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Valid Proof',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that your submitted proof has been approved.\n\n' + 'Best regards,\n'
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


const send2to3EmailClient = (email, name, lastname, pname) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Order rejected',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that your requested order:\n'+ pname +'\nhas been acquired by the traveler!. \n' + 'Best regards,\n'
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




const sendProofEmailRejected = async (email, name, lastname) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Valid Proof',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that your submitted proof has been rejected. \nPlease upload another one as soon as posssible.\n' + 'Best regards,\n'
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


const sendOrderRejectionEmail = (email, name, lastname, pname) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Order rejected',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that your requested order:\n'+ pname +'\nhas been rejected. \nDo not hesitate to contact us for any inconvenience.\n' + 'Best regards,\n'
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



const sendOrderAcceptEmail = async (email, name, lastname, pname, orderid, order_cost) => {
    const secret = process.env.SECRET_CONFIRM_ORDER
    const payload= {
        email: email,
        pname: pname
    }
    const token = jwt.sign(payload, secret, {expiresIn: '31d'});
    const link = 'http://localhost:5000/confirmorder/'+token+'/'+orderid;
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Order rejected',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that your requested order:\n'+ pname +'\nhas been accepted.\n The delivery will cost you '+ order_cost +' \nClick on the link to confirm this order.\n'+link + '\n\nBest regards,\n'
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

module.exports.getTravelers_get = async (req, res) => {
    const travelers = await Traveler.find({approved: true});
    res.send(travelers);
}



module.exports.download_proof_get = async (req, res) => {
    const orderId = req.params.orderid;
    const order = await Order.findById(orderId);

    if(order){
        try{
            const filename = order.proof;
            if(!filename){
                res.send({message: 'A proof has not been sent by the Traveler'})
                return;
            }
            console.log(filename);
            const x = await s3.getObject({Bucket: BUCKET, Key: filename}).promise();
    
            res.send(x.Body);
    
        }catch(err){
            console.log(err);
        }
    }else{
        res.status(404).json({ message: 'Order not found.'})
    }
}


module.exports.rejectProof_post = async( req, res) => {
    const orderId = req.params.orderid;
    const order = await Order.findById(orderId);

    if(order){
        try{
            const travelerId = order.traveler;
            const traveler = await Traveler.findById(travelerId);
            const name = traveler.name;
            const lastname = traveler.lastname;
            const email = traveler.email;
            sendProofEmailRejected(email, name, lastname);
            res.status(200).send('Successfully Rejected the Proof Upload')
        }catch(err){
            console.log(err);
            res.status(500).json( {message: 'Sever Error Occured'})
        }
    }else{
        res.status(404).json({message: 'Order not found'})
    }
}


module.exports.update_delivery_status_post = async (req, res) => {
    const orderId = req.params.orderid;
    const order = await Order.findById(orderId);

    if(order){
        try{
            const travelerId = order.traveler;
            const traveler = await Traveler.findById(travelerId);
            const name = traveler.name;
            const lastname = traveler.lastname;
            const email = traveler.email;
            if(order.status==2){
                order.status = 3;
                order.save().then(sendProofEmailApproved(email, name, lastname));

                const prodId = order.item;
                const prod = Product.findById(prodId);
                const clientId = order.client;
                const client = User.findById(clientId);
                send2to3EmailClient(client.email, client.name, client.lastname, prod.title)
                res.send({order, incremented: true});
            }
        }catch(err){
            console.log(err);
        }
    }else{
        res.status(404).json({ message: 'Order not found.'})
    }
}



module.exports.get_pendingOrders_get= async (req, res) => {
    const pendingOrders = await Order.find({status: 0});
    res.send(pendingOrders);
}



module.exports.get_anorder_get = async (req, res) => {
    const anOrdrerId = req.params.orderid;
    const anOrder = Order.findById(anOrdrerId);
    res.send(anOrder);
}



module.exports.get_waitingpending_get = async (req, res) => {
    const orders = await Order.find({status: 0, waiting_resp: true});
    res.send(orders);
}

