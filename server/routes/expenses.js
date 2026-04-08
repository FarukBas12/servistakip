const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authorize = require('../middleware/authorize');

// @route   POST api/expenses
// @desc    Create new expense
router.post('/', authorize(['admin', 'technician', 'depocu']), expenseController.createExpense);

// @route   GET api/expenses
// @desc    Get expenses (Admin gets all, user gets own)
router.get('/', authorize(['admin', 'technician', 'depocu']), expenseController.getExpenses);

// @route   PUT api/expenses/:id/status
// @desc    Update expense status (Admin only)
router.put('/:id/status', authorize(['admin']), expenseController.updateExpenseStatus);

// @route   DELETE api/expenses/:id
// @desc    Delete expense (Admin only)
router.delete('/:id', authorize(['admin']), expenseController.deleteExpense);

module.exports = router;
