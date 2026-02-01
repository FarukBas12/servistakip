
const express = require('express');
const router = express.Router();
const regionController = require('../controllers/regionController');
const auth = require('../middleware/auth');

router.get('/', auth, regionController.getRegions);
router.post('/', auth, regionController.addRegion);
router.delete('/:id', auth, regionController.deleteRegion);

module.exports = router;
