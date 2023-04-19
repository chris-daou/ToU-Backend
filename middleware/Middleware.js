const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Traveler = require('../models/Traveler');

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;

    //check json web token exists & verified
    if(token){
        jwt.verify(token, process.env.SECRET_JWT, (err, decodedToken) => {
            if(err){
                console.log(err.message);
                res.redirect('/login');
            }else{
                console.log(decodedToken);
                next();
            }
        })
    }
    else{
        res.redirect('/login');
    }

    
}

//check current user
const checkUser = (req, res, next) => {
    const token = req.cookies.uauthjwt;

    if(token){
        jwt.verify(token, process.env.SECRET_JWT, async (err, decodedToken) => {
            if(err){
                console.log(err);
                res.locals.user = null;
                req.user = null;
                res.send('Please login before accessing this page.')
            }else{
                //use decodedToken to access payload
                let user = await User.findById(decodedToken.id);
                res.locals.user = user;//this way, user can be used in views and we can tackle its attributes
                req.user = user;
                next();
            }
        })
    }else{
        res.locals.user = null;
        res.send('Please login before accessing this page.')
        
    }
}

//check Traveler
const checkTraveler = (req, res, next) => {
    const token = req.cookies.tauthjwt;

    if(token){
        jwt.verify(token, process.env.SECRET_JWT, async (err, decodedToken) => {
            if(err){
                console.log(err);
                res.locals.user = null;
                req.user = null;
                next();
            }else{
                //use decodedToken to access payload
                let traveler = await Traveler.findById(decodedToken.id);
                res.locals.traveler = traveler;//this way, user can be used in views and we can tackle its attributes
                req.traveler = traveler;
                next();
            }
        })
    }else{
        res.locals.user = null;
        next();
    }
}



const checkRPtoken = async (req, res, next) => {
    const token = req.params.token;
    if(token){
        try{
            const secret = process.env.SECRET_JWT;
            const payload = jwt.verify(token, secret);
            if(payload){
                next();
            }else{
                res.status(400).json({message: 'Invalid Token'})
            }
        }catch(err){
            console.log(err);
            res.status(500).json({message: 'Server Error Occured.'})
        }
    }else{
        res.status(400).json({message: 'Invalid Token'})
    }
}

module.exports = {requireAuth, checkUser, checkTraveler, checkRPtoken};








