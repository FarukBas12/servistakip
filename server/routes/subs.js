const express = require('express');
const router = express.Router();
const controller = require('../controllers/subController');
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.use(auth);

// Subs
router.get('/', controller.listSubs);
router.post('/', controller.createSub);
router.put('/:id', controller.updateSub);
router.get('/:id/ledger', controller.getLedger);

// Cash
router.post('/cash', controller.addCash);

// Prices
router.get('/prices', controller.listPrices); // ?subId=
router.post('/prices', controller.addPrice);
router.post('/prices/import', upload.single('file'), controller.importPrices);

// Payments
router.post('/payments', controller.createPayment);

module.exports = router;
