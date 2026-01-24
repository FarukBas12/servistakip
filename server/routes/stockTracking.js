const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const stockTrackingController = require('../controllers/stockTrackingController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // In-memory storage for file processing

router.use(auth);

router.get('/', stockTrackingController.getStocks);
router.post('/', stockTrackingController.createStock);
router.put('/:id', stockTrackingController.updateStock);
router.delete('/:id', stockTrackingController.deleteStock);

router.post('/transaction', stockTrackingController.addTransaction);
router.get('/:id/history', stockTrackingController.getStockHistory);
router.post('/bulk', upload.single('file'), stockTrackingController.bulkImport); // New Route

module.exports = router;
