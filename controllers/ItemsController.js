const itemsService = require('../services/ItemsService');

class ItemsController {
  async getItems(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filterId = req.query.filterId ? parseInt(req.query.filterId) : null;
      const excludeSelected = req.query.excludeSelected === 'true';

      const result = itemsService.getItems(page, limit, filterId, excludeSelected);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getSelectedItems(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filterId = req.query.filterId ? parseInt(req.query.filterId) : null;

      const result = itemsService.getSelectedItems(page, limit, filterId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async addItem(req, res, next) {
    try {
      const { id } = req.body;

      if (!id || typeof id !== 'number') {
        return res.status(400).json({ error: 'ID is required and must be a number' });
      }

      const result = itemsService.queueAddItem(id);

      if (!result.queued) {
        return res.status(400).json({ error: result.error || result.message });
      }

      res.json({ message: result.message, id });
    } catch (error) {
      next(error);
    }
  }

  async updateSelection(req, res, next) {
    try {
      const { action, id, order } = req.body;

      if (action === 'select' || action === 'deselect') {
        if (!id || typeof id !== 'number') {
          return res.status(400).json({ error: 'ID is required for select/deselect' });
        }

        const result = itemsService.queueUpdateSelection(action, id);
        res.json({ message: result.message, id });
      } else if (action === 'reorder') {
        if (!Array.isArray(order)) {
          return res.status(400).json({ error: 'Order must be an array' });
        }

        const result = itemsService.queueUpdateSelection(action, null, order);
        res.json({ message: result.message, order: result.order });
      } else {
        return res.status(400).json({ error: 'Invalid action' });
      }
    } catch (error) {
      next(error);
    }
  }

  async getState(req, res, next) {
    try {
      const state = itemsService.getState();
      res.json(state);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ItemsController();

