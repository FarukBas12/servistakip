const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', paymentController.getPayments);
router.post('/', paymentController.createPayment);
router.get('/:id', paymentController.getPaymentById);
router.put('/:id/toggle-status', paymentController.toggleStatus);
router.delete('/:id', paymentController.deletePayment);

module.exports = router;
