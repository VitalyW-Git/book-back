import express, { Router } from 'express';
import itemsController from '../controllers/ItemsController';

const router: Router = express.Router();

router.get('/', itemsController.getItems.bind(itemsController));
router.get('/selected', itemsController.getSelectedItems.bind(itemsController));
router.get('/state', itemsController.getState.bind(itemsController));
router.post('/', itemsController.addItem.bind(itemsController));
router.put('/selected', itemsController.updateSelection.bind(itemsController));

export default router;

