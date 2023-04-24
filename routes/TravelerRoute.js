const { Router } = require('express');

const travController = require('../controllers/TravelerController');
const { checkTraveler, requireTravelerAuth } = require('../middleware/Middleware');
const middleware = require('../middleware/Middleware');

const router = Router();


// router.get('/traveler/:id/home')

// router.get('/traveler/:id/new-orders')

// router.get('/traveler/:id/new-orders/:order-id/accept')
router.get('/traveler/home/neworders/:orderid/accept', requireTravelerAuth,travController.accept_order_GET);

router.post('/traveler/home/neworders/:orderid/accept', checkTraveler,travController.accept_order);
router.post('/traveler/home/neworders/:orderid/reject', travController.reject_order);

// router.get('/traveler/:id/active-orders')
// router.get('/traveler/:id/active-orders/:order-id')
router.post("/traveler/home/activeorders/:orderid/uploadproof", travController.uploadProof_post);

router.post('/traveler/home/activeorders/:orderid/markassent', travController.markshipped)

router.get('/traveler/home/activeorders',checkTraveler, travController.activeOrders_get)
router.get('/traveler/home/pendingorders',checkTraveler, travController.pendingOrders_get);
router.get('/checktokenmobile', middleware.checkTocken_mb);



// router.get('/traveler/:id/completed-orders')
// router.get('/traveler/:id/completed-orders/:order-id')


module.exports = router;