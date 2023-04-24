const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Traveler = require('../models/Traveler');
const Token = require('../models/Token');
const { access } = require('fs');



//check current user
const checkUser = (req, res, next) => {
    const token = req.cookies.uauthjwt;

    if(token){
        jwt.verify(token, process.env.SECRET_JWT, async (err, accessPayload) => {
            if(err){
                console.log(err);
                res.locals.user = null;
                req.user = null;
                res.send('Please login before accessing this page.')
            }else{
                //use accessPayload to access payload
                let user = await User.findById(accessPayload.id);
                res.locals.user = user;//this way, user can be used in views and we can tackle its attributes
                req.user = user;
                next();
            }
        })
    }else{
      const authHeader = req.headers['authorization'];
      const token1 = authHeader && authHeader.split(' ')[1];
      if(token1){
        jwt.verify(token1, process.env.SECRET_JWT, async (err, accessPayload) => {
            if(err){
                console.log(err);
                res.locals.user = null;
                req.user = null;
                res.send('Please login before accessing this page.')
            }else{
                //use accessPayload to access payload
                let user = await User.findById(accessPayload.id);
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
}

//check Traveler
const checkTraveler = (req, res, next) => {
  const token = req.cookies.tauthjwt;
  if(token){
    jwt.verify(token, process.env.SECRET_JWT, async (err, accessPayload) => {
      if(err){
        console.log(err);
        res.locals.user = null;
        req.user = null;
        next();
      }
      else{
        //use accessPayload to access payload
        let traveler = await Traveler.findById(accessPayload.id);
        res.locals.traveler = traveler;//this way, user can be used in views and we can tackle its attributes
        req.traveler = traveler;
        next();
      }
    })
  }
  else{
    const authHeader = req.headers['authorization'];
    const token1 = authHeader && authHeader.split(' ')[1];
    if(token1){
      jwt.verify(token1, process.env.SECRET_JWT, async (err, accessPayload) => {
        if(err){
          console.log(err);
          res.locals.user = null;
          req.user = null;
          res.send('Please login before accessing this page.')
        }
        else{
          //use accessPayload to access payload
          let traveler = await Traveler.findById(accessPayload.id);
          res.locals.traveler = traveler;//this way, user can be used in views and we can tackle its attributes
          req.traveler = traveler;
          next();
        }
      })
    }
    else{  
      res.locals.user = null;
      next();
    }
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

const requireTravelerAuth = async (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];


    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  
    try {
      const accessPayload = jwt.verify(token, process.env.SECRET_JWT);
  
      if (!accessPayload) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
  
      // Check if the token has expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (accessPayload.exp < currentTime) {
        // Get the refresh token from the database
        const ARtoken = await Token.findOne({ accessToken: token });
  
        if (!ARtoken) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
  
        // Verify the refresh token and get its payload
        const decodedRefreshToken = jwt.verify(ARtoken.refreshToken, process.env.SECRET_REFRESH_JWT);
        

        // Generate a new access token and save it in the database
        if(decodedRefreshToken && decodedRefreshToken.exp < currentTime){
            const newAccessToken = jwt.sign(
                { id: decodedRefreshToken.user, type: decodedRefreshToken.type },
                process.env.SECRET_JWT,
                { expiresIn: '1h' }
              );
              await Token.updateOne(
                { refreshToken: ARtoken.refreshToken },
                { accessToken: newAccessToken }
              );
        
              // Set the new access token in the response cookie
              res.cookie('tauthjwt', newAccessToken, { httpOnly: true });
              next();
        }else{
            return res.status(401).json({ message: 'Unauthorized' });
        }
      }
  
      // Pass the user ID to the next middleware
      req.userId = accessPayload.id;
      req.userType = accessPayload.type;
      next();
    } catch (err) {
      console.log(err);
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };


const requireClientAuth = async (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
  
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  
    try {
      const accessPayload = jwt.verify(token, process.env.SECRET_JWT);
  
      if (!accessPayload) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
  
      // Check if the token has expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (accessPayload.exp < currentTime) {
        // Get the refresh token from the database
        const ARtoken = await Token.findOne({ accessToken: token });
  
        if (!ARtoken) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
  
        // Verify the refresh token and get its payload
        const decodedRefreshToken = jwt.verify(ARtoken.refreshToken, process.env.SECRET_REFRESH_JWT);
        

        // Generate a new access token and save it in the database
        if(decodedRefreshToken && decodedRefreshToken.exp < currentTime){
            const newAccessToken = jwt.sign(
                { id: decodedRefreshToken.user, type: decodedRefreshToken.type },
                process.env.SECRET_JWT,
                { expiresIn: '1h' }
              );
              await Token.updateOne(
                { refreshToken: ARtoken.refreshToken },
                { accessToken: newAccessToken }
              );
        
              // Set the new access token in the response cookie
              res.status(400).json({newAccessToken});
              next();
        }else{
            return res.status(401).json({ message: 'Unauthorized' });
        }
      }
  
      // Pass the user ID to the next middleware
      req.userId = accessPayload.id;
      req.userType = accessPayload.type;
      next();
    } catch (err) {
      console.log(err);
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };

const checkToken_mb = async (req, res,next) => {
  try{
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if(token){
        jwt.verify(token, process.env.SECRET_JWT, async (err, accessPayload) => {
          if(err){
            req.stat = 692;
            next();
          }
          else{
            const traveler = await Traveler.findById(accessPayload.id);
            if(traveler){
              req.stat=690;
              next();
            }
            else{
              const client = await User.findById(accessPayload.id);
              if (client) {
                req.stat=691;
                next();
              }
              else{
                req.stat=692;
                next();
              }
            }
          }
        })
      }
      else{  
        req.stat=692;
        next();
      }
    }
  catch(err){
    console.log(err);
    req.stat=500;
    next();
  }}
  
module.exports = {requireTravelerAuth, checkUser, checkTraveler, checkRPtoken, requireClientAuth, checkToken_mb};








