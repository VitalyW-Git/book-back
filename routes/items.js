const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/ItemsController');

router.get('/', itemsController.getItems.bind(itemsController));
router.get('/selected', itemsController.getSelectedItems.bind(itemsController));
router.get('/state', itemsController.getState.bind(itemsController));
router.post('/', itemsController.addItem.bind(itemsController));
router.put('/selected', itemsController.updateSelection.bind(itemsController));

module.exports = router;
