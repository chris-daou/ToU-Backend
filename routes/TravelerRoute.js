const { Router } = require('express');

const travController = require('../controllers/TravelerController');
const { checkTraveler, checkToken_mb, requireAuth } = require('../middleware/Middleware');

const router = Router();


// router.get('/traveler/:id/home')

// router.get('/traveler/:id/new-orders')

// router.get('/traveler/:id/new-orders/:order-id/accept')
router.get('/traveler/home/neworders/:orderid/accept', requireAuth,travController.accept_order_GET);

router.post('/traveler/home/neworders/:orderid/accept', checkTraveler,travController.accept_order);
router.post('/traveler/home/neworders/:orderid/reject', travController.reject_order);

// router.get('/traveler/:id/active-orders')
// router.get('/traveler/:id/active-orders/:order-id')
router.post("/traveler/home/activeorders/:orderid/uploadproof", travController.uploadProof_post);

router.post('/traveler/home/activeorders/:orderid/markassent', travController.markshipped)

router.get('/traveler/home/pendingorders',requireAuth, travController.getPendingTrav_get)
router.get('/traveler/home/activeorders',requireAuth, travController.getActiveTrav_get);
router.get('/checktokenmobile', checkToken_mb, travController.splashScreen_get);



// router.get('/traveler/:id/completed-orders')
// router.get('/traveler/:id/completed-orders/:order-id')


module.exports = router;