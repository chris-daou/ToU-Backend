const { Router } = require('express');
const clientController = require('../controllers/ClientController');
const productController = require('../controllers/ProductController');

const { requireAuth, checkUser } = require('../middleware/Middleware');


const router = Router();
router.get("/client/home/searchproduct", checkUser, productController.productsearch_get);

router.post("/client/home/searchproduct", productController.productsearch_post);

router.post("/client/home/searchproduct/:asin/:quantity", checkUser, productController.productrequest_post);

router.get('/confirmorder/:token/:orderid', clientController.confirm_order_get);
//Client confirms their order

router.get('/client/home/pendingorders',clientController.getPendingClient_get);
//Client gets list of pending orders

router.get('/client/home/activeorders', clientController.getActiveClient_get);
//Client gets list of active orders

router.get('/client/home/activeorders/:orderid', clientController.getActiveOrder_get)
//Client gets specific active order

router.get('/client/home/profile',clientController.getProfile);
//Client gets their profile

router.put('/client/home/profile/edit', checkUser, clientController.editProfile);
//Change simple things

router.post('/client/home/profile/edit/changepassword',)


router.post('/client/home/activeorder/:orderid/markascomplete', clientController.complete_order_post);
//Client completes order

module.exports = router;