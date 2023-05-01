const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Traveler = require('../models/Traveler');
const Feedback = require('../models/Feedback');
const Ticket = require('../models/Ticket');
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



  const sendAssignedEmailClient = async (email, name, lastname, pname, d1, d2) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Order Assigned!',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that your order:\n'+ pname+'\nHas been assigned to a traveler and will soon be on its way ToU!\nIt should arrive between '+ d1 + ' and '+d2 +'\n\nBest regards,\n'
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

module.exports.accept_order_GET = async (req, res) => {
    res.send("You are here. "+req.userId)
}
module.exports.accept_order = async (req, res) => {
    const travelerId = req.userId;
    const orderId = req.params.orderid;
    const token = req.nat;
    try {
        const traveler = await Traveler.findById(travelerId);
        const order = await Order.findById(orderId);
        if(!order.client_confirmed){
            res.status(400).json({ message:'Please wait until the client has confirmed their order', token});
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
            let indexc = client.pending_orders.indexOf(orderId);
            if (indexc !== -1) {
                client.pending_orders.splice(indexc, 1);
            }
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
            res.status(200).json({message: 'Successfully Accepted Order',token});
        }
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: 'Failed to assign order', token });
    }
}

module.exports.reject_order = async (req, res) => {
    const travelerId = req.userId;
    const orderId = req.params.orderid;
    const token = req.nat;
    try {
        const traveler = await Traveler.findById(travelerId);
        const order = await Order.findById(orderId);

        if((order.status == 1 || order.status == 2) && order.waiting_resp == true && traveler.new_orders.includes(orderId)) {
            let index = traveler.new_orders.indexOf(orderId);
            if (index !== -1) {
                traveler.new_orders.splice(index, 1);
            }
            order.status = 0;
            order.pickup_location = "";
            order.estimated_arrival = "";
            order.waiting_resp = false;
            order.traveler = null;
            await order.save();
            await traveler.save(); // save the updated traveler object to the database
        }

        res.status(200).json({ message: 'Order rejected' , token});
    } catch (err) {
        console.log(err.message);
        res.status(400).json({ message: 'Failed to assign order', token });
    }
}

module.exports.cancel_flight = async (req, res) => {
    const travelerId = req.userId;
    const traveler = await Traveler.findById(travelerId);
    try{
        for (let i = 0; i < traveler.new_orders.length; i++) {
            const order = await Order.findById(traveler.new_orders[i]);
            order.traveler = null;
            order.pickup_location = "";
            order.waiting_resp = false;
            order.status = 0;
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
        for (let i = 0; i < traveler.assigned_orders.length; i++) {
            const order = await Order.findById(traveler.assigned_orders[i]);
            order.traveler = null;
            order.waiting_resp = false;
            order.status = 0;
            order.estimated_arrival = "";
            order.pickup_location = "";
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
        traveler.canceled_orders.concat(traveler.assigned_orders, traveler.new_orders);
        traveler.active = false;
        traveler.new_orders = [];
        traveler.assigned_orders = [];
        traveler.provided_pickup = "";
        await traveler.save();
        return res.status(200).json({ message: 'Flight canceled' , token});
    }
    catch{
        res.status(400).json({ message: 'Failed to cancel flight' , token});
    }
};

module.exports.providePickup_post = async (req, res) => {
    const travelerId = req.userId;
    const token = req.nat;
    const traveler = await Traveler.findById(travelerId);
    traveler.provided_pickup = req.body.pickupLocation;
    await traveler.save();
    res.status(200).send({message: 'Pickup location provided',token});
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
        return res.status(400).send({ error: err.message, token });
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
    const token = req.nat;
    upload2.single('file')(req, res, async (err) => {
      if (err) {
        console.log(err);
        return res.status(400).send({ error: err.message, token });
      }
      const orderId = req.params.orderid;
      const order = await Order.findById(orderId);

      const filename = req.file.key; 
      
      order.proof = filename;
      order.save().then(console.log(order));
      
      res.send({message:'Done', token});
    });
  };



  const sendOnTheWayEmail = async (email, name, lastname, pname) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Your Order is on its way!',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that your order:\n'+ pname+'\nIs being shipped and will be soon delivered ToU!\n\nBest regards,\n'
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


module.exports.markshipped = async(req, res) => {
    const token = req.nat;
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
           return res.status(200).json({message: 'Order marked as shipped', token});
        }catch(err){
            console.log(err);
            res.status(500).json({message: 'Server Error Occured', token});
        }
    }else{
        res.status(404).json({message: 'Order not Found.', token})
    }
}

const sendArrivedEmail = async (email, name, lastname, pname) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Your Order is in Lebanon!',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that your order:\n'+ pname+'\nLanded in Lebanon and will soon be on its way ToU!\n\nBest regards,\n'
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



module.exports.markarrived = async(req, res) => {
    const token = req.nat;
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
              return res.status(200).json({message: 'Order marked as arrived', token}); 
        }catch(err){
            console.log(err);
            res.status(500).json({message: 'Server Error Occured', token});
        }
    }else{
        res.status(404).json({message: 'Order not Found.', token})
    }
}

module.exports.getPendingTrav_get = async (req, res) => {
    const travId = req.userId;
    const trav = await Traveler.findById(travId);
    const token = req.nat;
    if(trav){
        try{
            const list = trav.new_orders;
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
        res.status(404).json( { message: 'Traveler Not Found', token})
    }
}

module.exports.getActiveTrav_get = async (req, res) => {
    const travId = req.userId;
    const trav = await Traveler.findById(travId);
    const token = req.nat;
    if(trav){
        try{
            const list = trav.assigned_orders;
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

module.exports.splashScreen_get = async(req, res) => {
    try{
        const token = req.nat;
        const type = req.userType;
        if(type == 'User'){
            return res.status(200).send({status: 691, token});
        }
        else if(type == 'Traveler'){
            return res.status(200).send({status: 690, token});
        }
        else{
            return res.status(200).send({status: 692, token:''});
        }
    }
    catch(err){
        console.log(err);
        res.status(500).send({message: 'Server Error Occured', token});
    }
}

module.exports.getProfile = async (req, res) => {
    const travId = req.userId;
    const token = req.nat;
    const trav = await Traveler.findById(travId);
    if(trav){
        console.log(trav)
        res.status(200).send({trav, token});
    }
    else{
    res.status(400).json( {message: 'Something went wrong', token} )
    }
}


module.exports.editProfile = async (req, res) => {
    const travId = req.userId;
    const token = req.nat;
    const trav = await Traveler.findById(travId);
    if(trav){
        try {
            const trav = await Traveler.findByIdAndUpdate(travId, req.body, { new: true });
            res.send({trav, token});
          } catch (error) {
            res.status(500).send(error);
          }
    }else{
        res.status(500).send(error, token);
    }
}

module.exports.hasTicket = async (req, res) => {
    const travId = req.userId;
    const token = req.nat;
    try{
        const trav = await Traveler.findById(travId);
        if(trav){
            if(trav.active){
                const ticket = await Ticket.findById(trav.ticket);
                return res.status(200).send({hasTicket:true,ticket, token});
            }
            else{
                return res.status(200).send({hasTicket:false, token});
            }
        }
        else{
            res.status(400).json( {message: 'Something went wrong', token} )
        }
    }
    catch(err){
        console.log(err);
        res.status(500).send({message: 'Server Error Occured', token});
    }
}