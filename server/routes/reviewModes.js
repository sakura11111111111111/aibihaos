const express = require('express');
const router = express.Router();
const reviewModeController = require('../controllers/reviewModeController');

router.get('/', reviewModeController.getAllReviewModes);
router.post('/', reviewModeController.createReviewMode);
router.delete('/:id', reviewModeController.deleteReviewMode);

module.exports = router;
