const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoute');
const productRoutes = require('./routes/productRoute');
const travRoutes = require('./routes/travelerRoute');
const AdminRoute = require('./routes/AdminRoute');
const cookieParser = require('cookie-parser');
const { requireAuth, checkUser } = require('./middleware/authMiddleware');
const cors = require('cors');
// const bodyParser = require('body-parser');
const Admin = require('./models/Admin')
const app = express();
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());

// middleware
app.use(express.static('public'));
app.use(express.json());//takes any json obj that comes with a req and parses it for us so we can use it.
app.use(cookieParser());
// view engine
app.set('view engine', 'ejs');

// database connection
mongoose.set('strictQuery', false);
mongoose.connect("mongodb+srv://vickenk8:lF4PbJg2PKGljdDM@cluster0.3zxbi6j.mongodb.net/test", {useNewUrlParser: true, useUnifiedTopology: true});

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'exp://192.168.16.101:19000/');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(cors());

// routes
app.get('*', checkUser);
app.get('/', (req, res) => res.render('home'));
app.get('/smoothies', requireAuth,(req, res) => res.render('smoothies'));
app.use(authRoutes);
app.use(productRoutes);
app.use(travRoutes);
app.use(AdminRoute);


//Create Admin
// const newAdmin = new Admin({
//     username: 'VBEC',
//     password: '12345',
//   });
// newAdmin.save().then(console.log("Successfully Created new Admin"));

app.listen(5000, function(){
  console.log("Server started on port 5000");
})
