const express = require('express');
const router = express.Router();
const controller = require('../controllers/subController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Cloudinary Storage for Images
const { storage } = require('../utils/cloudinary');
const upload = multer({ storage: storage });

// Memory Storage for Excel
const uploadMemory = multer({ storage: multer.memoryStorage() });

router.use(auth);

// Subs
router.get('/', controller.listSubs);
router.post('/', controller.createSub);
router.put('/:id', controller.updateSub);
router.post('/:id/delete', controller.deleteSub); // POST to send body with password
router.get('/:id/ledger', controller.getLedger);

// Settings
router.get('/settings/all', controller.getSettings);
router.put('/settings/all', controller.updateSettings);
router.delete('/transaction/:type/:id', controller.deleteTransaction);

// Cash
router.post('/cash', controller.addCash);

// Prices
router.get('/prices', controller.listPrices); // ?subId=
router.post('/prices', controller.addPrice);
router.post('/prices/import', uploadMemory.single('file'), controller.importPrices);

// Payments
router.post('/payments', upload.single('waybill'), controller.createPayment);
router.get('/payment/:id', controller.getPaymentDetails);

module.exports = router;
