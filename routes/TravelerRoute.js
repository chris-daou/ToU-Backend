const { Router } = require('express');

const travController = require('../controllers/travelerController');
const { checkTraveler } = require('../middleware/authMiddleware');

const router = Router();


// router.get('/traveler/:id/home')

// router.get('/traveler/:id/new-orders')

// router.get('/traveler/:id/new-orders/:order-id/accept')
router.post('/traveler/home/neworders/:orderid/accept', checkTraveler,travController.accept_order);
router.post('/traveler/home/neworders/:orderid/reject', travController.reject_order);

// router.get('/traveler/:id/active-orders')
// router.get('/traveler/:id/active-orders/:order-id')
router.post("/traveler/home/activeorders/:orderid/uploadproof", travController.uploadProof_post);

router.post('/traveler/home/activeorders/:orderid/markassent', travController.marksent)



// router.get('/traveler/:id/completed-orders')
// router.get('/traveler/:id/completed-orders/:order-id')


module.exports = router;