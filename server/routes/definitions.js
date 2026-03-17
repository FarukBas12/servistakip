const express = require('express');
const router = express.Router();
const subcontractorController = require('../controllers/subController');
const priceController = require('../controllers/priceController');
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.use(auth);

// Subcontractors
router.get('/subs', subcontractorController.listSubs);
router.post('/subs', subcontractorController.createSub);
router.delete('/subs/:id', subcontractorController.deleteSub);
router.post('/subs/transaction', subcontractorController.addCash); // New

// Prices
router.get('/prices', priceController.list); // ?q=search&subId=X
router.post('/prices', priceController.create);
router.post('/prices/import', upload.single('file'), priceController.importPrices); // Supports subId in body
router.delete('/prices/:id', priceController.delete);

module.exports = router;
