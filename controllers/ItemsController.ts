import { Request, Response, NextFunction } from 'express';
import itemsService from '../services/ItemsService';
import {ItemsResponseInterface} from "../types/interface";
import {ActionEnum} from "../types/enum/ActionEnum";

class ItemsController {
  async getItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const filterId = req.query.filterId ? parseInt(req.query.filterId as string) : null;

      const result: ItemsResponseInterface = itemsService.getItems(page, limit, filterId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getSelectedItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const filterId = req.query.filterId ? parseInt(req.query.filterId as string) : null;

      const result = itemsService.getSelectedItems(page, limit, filterId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.body;

      if (!id) {
        res.status(400).json({ error: 'ID должен быть числом' });
        return;
      }

      const result = itemsService.queueAddItem(id);

      if (!result.queued) {
        res.status(400).json({ error: result.error || result.message });
        return;
      }

      res.json({ message: result.message, id });
    } catch (error) {
      next(error);
    }
  }

  async updateSelection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { action, id, order } = req.body;

      if (action === ActionEnum.SELECT || action === ActionEnum.DESELECT) {
        if (!id) {
          res.status(400).json({ error: 'ID обязателен для select/deselect' });
          return;
        }

        const result = itemsService.queueUpdateSelection(action, id);
        res.json({ message: result.message, id });
      } else if (action === ActionEnum.REORDER) {
        if (!Array.isArray(order)) {
          res.status(400).json({ error: 'Сортировка должна быть массивом' });
          return;
        }

        const result = itemsService.queueUpdateSelection(ActionEnum.REORDER, undefined, order);
        res.json({ message: result.message, order: result.order });
      } else {
        res.status(400).json({ error: 'Не верный параметр' });
      }
    } catch (error) {
      next(error);
    }
  }
}

export default new ItemsController();