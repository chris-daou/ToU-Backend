//these are handle functions
const Traveler = require('../models/Traveler');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
// const bodyParser = require('body-parser');

let transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: 'donotreply.tou.lebanon@outlook.com', // your email address
      pass: '*31&pCbE' // your email password
    }
});

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

module.exports.tsignup_post = async (req, res) => {
    console.log(req.body);
    const date = Date.now();
    const upload = multer({
        storage: multerS3({
            bucket:BUCKET,
            s3:s3,
            acl:'public-read',
            key:(req, file, cb) => {
                const filename = date + "-" + file.originalname;
                cb(null, filename);
            }
        })
    })
    upload.fields([{ name: 'cv' }, { name: 'id' }])(req, res, async (err) => {
        if (err) {
          console.log(err);
          return res.status(400).send({ error: err.message });
        }
    try{
        const data = JSON.parse(req.body.otherData);
        const { name, lastname, gender, phone_number, nationality, email} = data;
        const traveler = await Traveler.create({ name, lastname, gender, phone_number, nationality, email, approved: false});
        traveler.cv = req.files['cv'][0].key;
        traveler.identification = req.files['id'][0].key;
        traveler.save();
        let mailOptions = {
            from: 'donotreply.tou.lebanon@outlook.com', // your email address
            to: email, // recipient's email address
            subject: 'ToU Traveler Registration',
            text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'Thank you for applying to be a traveler with ToU. Your application has been received and will be reviewed by our team. You will be notified by email once your application has been approved.\n\n' + 'Best regards,\n' + 'ToU Team'
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
        res.send(traveler);
    }catch (err){
        console.log(err);
        res.send({result : false});
    }
    });
};