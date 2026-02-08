const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');

router.get('/', calendarController.getNotes);
router.post('/', calendarController.addNote);
router.put('/:id', calendarController.updateNote);
router.delete('/:id', calendarController.deleteNote);

module.exports = router;
