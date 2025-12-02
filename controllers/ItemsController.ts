import { Request, Response, NextFunction } from 'express';
import itemsService from '../services/ItemsService';

class ItemsController {
  async getItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const filterId = req.query.filterId ? parseInt(req.query.filterId as string) : null;
      const excludeSelected = req.query.excludeSelected === 'true';

      const result = itemsService.getItems(page, limit, filterId, excludeSelected);
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

      if (!id || typeof id !== 'number') {
        res.status(400).json({ error: 'ID is required and must be a number' });
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

      if (action === 'select' || action === 'deselect') {
        if (!id || typeof id !== 'number') {
          res.status(400).json({ error: 'ID is required for select/deselect' });
          return;
        }

        const result = itemsService.queueUpdateSelection(action, id);
        res.json({ message: result.message, id });
      } else if (action === 'reorder') {
        if (!Array.isArray(order)) {
          res.status(400).json({ error: 'Order must be an array' });
          return;
        }

        const result = itemsService.queueUpdateSelection(action, undefined, order);
        res.json({ message: result.message, order: result.order });
      } else {
        res.status(400).json({ error: 'Invalid action' });
      }
    } catch (error) {
      next(error);
    }
  }

  async getState(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const state = itemsService.getState();
      res.json(state);
    } catch (error) {
      next(error);
    }
  }
}

export default new ItemsController();

