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
