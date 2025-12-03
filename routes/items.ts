import express, { Router } from "express";
import ItemsController from "../controllers/ItemsController";

const router: Router = express.Router();

router.get("/", ItemsController.getItems.bind(ItemsController));
router.get("/selected", ItemsController.getSelectedItems.bind(ItemsController));
router.post("/", ItemsController.addItem.bind(ItemsController));
router.put("/selected", ItemsController.updateSelection.bind(ItemsController));

export default router;
