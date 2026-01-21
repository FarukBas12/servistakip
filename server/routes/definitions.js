const express = require('express');
const router = express.Router();
const subcontractorController = require('../controllers/subcontractorController');
const priceController = require('../controllers/priceController');
const auth = require('../middleware/auth');

router.use(auth);

// Subcontractors
router.get('/subs', subcontractorController.list);
router.post('/subs', subcontractorController.create);
router.delete('/subs/:id', subcontractorController.delete);
router.post('/subs/transaction', subcontractorController.addTransaction); // New

// Prices
router.get('/prices', priceController.list); // ?q=search
router.post('/prices/import', priceController.importPrices);
router.delete('/prices/:id', priceController.delete);

module.exports = router;
