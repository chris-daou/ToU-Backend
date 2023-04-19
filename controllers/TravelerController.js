const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Traveler = require('../models/Traveler');
const jwt = require('jsonwebtoken');
const cheerio = require('cheerio');
const request = require('request-promise')
const { requireAuth, checkUser } = require('../middleware/Middleware');
const nodemailer = require('nodemailer');
require('dotenv').config();
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const moment = require('moment');

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



  const sendAssignedEmailClient = (email, name, lastname, pname, d1, d2) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Order Assigned!',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that your order:\n'+ pname+'\nHas been assigned to a traveler and will soon be on its way ToU!\nIt should arrive between '+ d1 + ' and '+d2 +'\n\nBest regards,\n'
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

module.exports.accept_order_GET = async (req, res) => {
    res.send("You are here. "+req.userId)
}
module.exports.accept_order = async (req, res) => {
    const travelerId = req.traveler._id;
    const orderId = req.params.orderid;

    try {
        const traveler = await Traveler.findById(travelerId);
        const order = await Order.findById(orderId);
        if(!order.client_confirmed){
            res.status(400).json({ message:'Please wait until the client has confirmed their order'});
            return;
        }

        if(order.status == 2 && order.waiting_resp == true && traveler.new_orders.includes(orderId) && order.client_confirmed && traveler.ticket) {
            console.log('here')
            let index = traveler.new_orders.indexOf(orderId);
            console.log(index);
            if (index !== -1) {
                console.log("HEERE");
                traveler.new_orders.splice(index, 1);
                console.log(traveler.new_orders);
                await traveler.save();
            }
            traveler.assigned_orders.push(orderId); // add the order to the assigned_orders array
            
            order.waiting_resp = false;
            const clientId = order.client;
            const client = await User.findById(clientId);
            client.active_orders.push(orderId);
            await client.save();
            const prodId = order.item;
            const prod = Product.findById(prodId);

            const ticketId = traveler.ticket;
            const ticket = Ticket.findById(ticketId);
            let date_string = ticket.departure;
            let date_format = "DDMMM";
            let date = moment(date_string, date_format);
            let new_date = date.add(7, 'days');
            let new_date_string = new_date.format(date_format);

            sendAssignedEmailClient(client.email, client.name, client.lastname, prod.title, date_string, new_date_string);
            await order.save();
            await traveler.save(); // save the updated traveler object to the database
            res.status(200).json({message: 'Successfully Accepted Order'});
        }
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: 'Failed to assign order' });
    }
}

module.exports.reject_order = async (req, res) => {
    const travelerId = req.traveler._id;
    const orderId = req.params.id;

    try {
        const traveler = await Traveler.findById(travelerId);
        const order = await Order.findById(orderId);

        if(order.status == 0 && order.waiting_resp == true && traveler.new_orders.includes(orderId)) {
            let index = traveler.new_orders.indexOf(orderId);
            if (index !== -1) {
                traveler.new_orders = traveler.new_orders.splice(index, 1);
            }
            order.waiting_resp = false;
            order.traveler = null;
            await order.save();
            await traveler.save(); // save the updated traveler object to the database
        }

        res.status(200).json({ message: 'Order rejected' });
    } catch (err) {
        console.log(err.message);
        res.status(400).json({ message: 'Failed to assign order' });
    }
}

module.exports.cancel_flight = async (req, res) => {
    const travelerId = req.traveler._id;
            const traveler = await Traveler.findById(travelerId);
    try{
        for (let i = 0; i < traveler.new_orders.length; i++) {
            const order = await Order.findById(traveler.new_orders[i]);
            order.traveler = "";
            order.waiting_resp = false;
            await order.save();
            let mailOptions = {
                from: 'donotreply.tou.lebanon@outlook.com', // your email address
                to: trav.email, // recipient's email address
                subject: 'ToU: Order back to pending',
                text: 'Dear ' + (await User.findById(order.client).name) + ' ' + (await User.findById(order.client).lastname) + ',\n\n' + 'Your order has been canceled by the traveler. It is now back to pending.\nFor more information, please contact us.\n\n' + 'Best regards,\n' + 'The ToU Team'
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
        };
        for (let i = 0; i < traveler.assigned_orders.length; i++) {
            const order = await Order.findById(traveler.assigned_orders[i]);
            order.traveler = "";
            order.waiting_resp = false;
            order.status = 1;
            order.estimated_arrival = "";
            await order.save();
            let mailOptions = {
                from: 'donotreply.tou.lebanon@outlook.com', // your email address
                to: trav.email, // recipient's email address
                subject: 'ToU: Order back to pending',
                text: 'Dear ' + (await User.findById(order.client).name) + ' ' + (await User.findById(order.client).lastname) + ',\n\n' + 'Your order has been canceled by the traveler. It is now back to pending.\nFor more information, please contact us.\n\n' + 'Best regards,\n' + 'The ToU Team'
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
        };
        const canceled = traveler.canceled_orders.concat(traveler.assigned_orders, traveler.new_orders);
        traveler.active = false;
        traveler.new_orders = [];
        traveler.assigned_orders = [];
        traveler.canceled_orders = canceled;
        await traveler.save();
    }
    catch{
        res.status(400).json({ message: 'Failed to cancel flight' });
    }
};

module.exports.providePickup_post = async (req, res) => {
    const travelerId = req.traveler._id;
    const loc = req.body.location;
    const traveler = await Traveler.findById(travelerId);
    for(let i = 0; i < traveler.assigned_orders.length; i++) {
        const order = await Order.findById(traveler.assigned_orders[i]);
        order.pickup_location = loc;
        await order.save();
    };
    for(let i = 0; i < traveler.new_orders.length; i++) {
        const order = await Order.findById(traveler.new_orders[i]);
            order.waiting_resp = false;
            order.traveler = "";
            await order.save();
            let mailOptions = {
                from: 'donotreply.tou.lebanon@outlook.com', // your email address
                to: trav.email, // recipient's email address
                subject: 'ToU: Order back to pending',
                text: 'Dear ' + (await User.findById(order.client).name) + ' ' + (await User.findById(order.client).lastname) + ',\n\n' + 'Unfortunately, the traveler we assigned the order to did not accept it. Your order is still pending to be assigned to another traveler.\nFor more information, please contact us.\n\n' + 'Best regards,\n' + 'The ToU Team'
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
    };
    traveler.provided_pickup = true;
    traveler.new_orders = [];
    traveler.save();
    res.send('Done');
};

const upload1 = multer({
    storage: multerS3({
        bucket:BUCKET,
        s3:s3,
        acl:'public-read',
        key:(req, file, cb) => {
            const filename = req.params.orderid + '_receipt';
            cb(null, filename);
        } 
    })
})

module.exports.uploadReceipt_post = async (req, res) => {
    upload1.single('file')(req, res, async (err) => {
      if (err) {
        console.log(err);
        return res.status(400).send({ error: err.message });
      }
      const orderId = req.params.orderid;
      const order = await Order.findById(orderId);

      const filename = req.file.key; 
      
      order.receipt = filename;
      order.save().then(console.log(order));
      
      res.send('Done');
    });
};

const upload = multer({
    storage: multerS3({
        bucket:BUCKET,
        s3:s3,
        acl:'public-read',
        key:(req, file, cb) => {
            const filename = req.params.orderid + '_proof';
            cb(null, filename);
        } 
    })
})



const upload2 = multer({
    storage: multerS3({
        bucket:BUCKET,
        s3:s3,
        acl:'public-read',
        key:(req, file, cb) => {
            const filename = req.params.orderid + '_proof';
            cb(null, filename);
        } 
    })
})



module.exports.uploadProof_post = async (req, res) => {
    upload2.single('file')(req, res, async (err) => {
      if (err) {
        console.log(err);
        return res.status(400).send({ error: err.message });
      }
      const orderId = req.params.orderid;
      const order = await Order.findById(orderId);

      const filename = req.file.key; 
      
      order.proof = filename;
      order.save().then(console.log(order));
      
      res.send('Done');
    });
  };



  const sendOnTheWayEmail = (email, name, lastname, pname) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Your Order is on its way!',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that your order:\n'+ pname+'\nIs being shipped and will be soon delivered ToU!\n\nBest regards,\n'
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


module.exports.markshipped = async(req, res) => {
    const orderId = req.params.orderid;
    const order = await Order.findById(orderId);
    if(order){
        try{
           if(order.status == 3){
            order.status = 4;
            order.save();

            const clientId = order.client;
            const client = await User.findById(clientId);
            const prodId = order.item;
            const prod = await Product.findById(prodId);

            sendOnTheWayEmail(client.email, client.name, client.lastname, prod.title)
           } 
        }catch(err){
            console.log(err);
            res.status(500).json({message: 'Server Error Occured'});
        }
    }else{
        res.status(404).json({message: 'Order not Found.'})
    }
}

const sendArrivedEmail = (email, name, lastname, pname) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Your Order is in Lebanon!',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that your order:\n'+ pname+'\nLanded in Lebanon and will soon be on its way ToU!\n\nBest regards,\n'
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



module.exports.markarrived = async(req, res) => {
    const orderId = req.params.orderid;
    const order = await Order.findById(orderId);
    if(order){
        try{
           if(order.status == 4){
            order.status = 5;
            order.save();

            const clientId = order.client;
            const client = await User.findById(clientId);
            const prodId = order.item;
            const prod = await Product.findById(prodId);

            sendArrivedEmail(client.email, client.name, client.lastname, prod.title);
           } 
        }catch(err){
            console.log(err);
            res.status(500).json({message: 'Server Error Occured'});
        }
    }else{
        res.status(404).json({message: 'Order not Found.'})
    }
}


