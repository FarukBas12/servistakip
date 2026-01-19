const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', storeController.getAllStores);
router.post('/', storeController.createStore);
router.post('/bulk', storeController.bulkCreateStores);
router.get('/:code', storeController.searchStore);

module.exports = router;
