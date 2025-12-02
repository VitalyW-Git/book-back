const itemsRepository = require('../repositories/ItemsRepository');

class ItemsService {
  constructor() {
    this.requestQueue = {
      add: new Map(),
      get: new Map(),
      update: new Map(),
    };
    this.addBatchTimer = null;
    this.getBatchTimer = null;
    this.updateBatchTimer = null;
  }

  processAddBatch() {
    if (this.requestQueue.add.size === 0) {
      this.addBatchTimer = null;
      return;
    }

    const itemsToAdd = Array.from(this.requestQueue.add.values());
    this.requestQueue.add.clear();

    itemsToAdd.forEach(item => {
      itemsRepository.addItem(item);
    });

    this.addBatchTimer = setTimeout(() => this.processAddBatch(), 10000);
  }

  processGetBatch() {
    if (this.requestQueue.get.size === 0) {
      this.getBatchTimer = null;
      return;
    }

    this.requestQueue.get.clear();
    this.getBatchTimer = setTimeout(() => this.processGetBatch(), 1000);
  }

  processUpdateBatch() {
    if (this.requestQueue.update.size === 0) {
      this.updateBatchTimer = null;
      return;
    }

    const updates = Array.from(this.requestQueue.update.values());
    this.requestQueue.update.clear();

    updates.forEach(update => {
      if (update.type === 'select') {
        itemsRepository.selectItem(update.id);
      } else if (update.type === 'deselect') {
        itemsRepository.deselectItem(update.id);
      } else if (update.type === 'reorder') {
        itemsRepository.reorderItems(update.order);
      }
    });

    this.updateBatchTimer = setTimeout(() => this.processUpdateBatch(), 1000);
  }

  getItems(page = 1, limit = 20, filterId = null, excludeSelected = false) {
    let items = itemsRepository.getAllItems();

    if (filterId) {
      items = items.filter(item => item.id.toString().includes(filterId.toString()));
    }

    if (excludeSelected) {
      const selectedSet = itemsRepository.getSelectedItemsSet();
      items = items.filter(item => !selectedSet.has(item.id));
    }

    items.sort((a, b) => a.id - b.id);

    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedItems = items.slice(start, end);

    const queueKey = `${page}-${limit}-${filterId}-${excludeSelected}`;
    if (!this.requestQueue.get.has(queueKey)) {
      this.requestQueue.get.set(queueKey, { page, limit, filterId, excludeSelected });
      if (!this.getBatchTimer) {
        this.getBatchTimer = setTimeout(() => this.processGetBatch(), 1000);
      }
    }

    return {
      items: paginatedItems,
      total: items.length,
      page,
      limit,
      hasMore: end < items.length
    };
  }

  getSelectedItems(page = 1, limit = 20, filterId = null) {
    let items = itemsRepository.getSelectedItems();

    if (filterId) {
      items = items.filter(item => item.id.toString().includes(filterId.toString()));
    }

    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedItems = items.slice(start, end);

    const queueKey = `selected-${page}-${limit}-${filterId}`;
    if (!this.requestQueue.get.has(queueKey)) {
      this.requestQueue.get.set(queueKey, { page, limit, filterId, selected: true });
      if (!this.getBatchTimer) {
        this.getBatchTimer = setTimeout(() => this.processGetBatch(), 1000);
      }
    }

    return {
      items: paginatedItems,
      total: items.length,
      page,
      limit,
      hasMore: end < items.length,
      order: itemsRepository.getSelectedOrder()
    };
  }

  queueAddItem(id) {
    const queueKey = `add-${id}`;
    if (this.requestQueue.add.has(queueKey)) {
      return { queued: false, message: 'Item already in queue', id };
    }

    const maxId = itemsRepository.getMaxId();
    if (id <= maxId || itemsRepository.hasItem(id)) {
      return { queued: false, error: 'Item with this ID already exists' };
    }

    const newItem = { id };
    this.requestQueue.add.set(queueKey, newItem);

    if (!this.addBatchTimer) {
      this.addBatchTimer = setTimeout(() => this.processAddBatch(), 10000);
    }

    return { queued: true, message: 'Item queued for addition', id };
  }

  queueUpdateSelection(action, id, order) {
    if (action === 'select' || action === 'deselect') {
      const queueKey = `${action}-${id}`;
      if (!this.requestQueue.update.has(queueKey)) {
        this.requestQueue.update.set(queueKey, { type: action, id });
        if (!this.updateBatchTimer) {
          this.updateBatchTimer = setTimeout(() => this.processUpdateBatch(), 1000);
        }
      }

      if (action === 'select') {
        itemsRepository.selectItem(id);
      } else {
        itemsRepository.deselectItem(id);
      }

      return { success: true, message: `Item ${action}ed`, id };
    } else if (action === 'reorder') {
      const queueKey = 'reorder';
      this.requestQueue.update.set(queueKey, { type: 'reorder', order });
      if (!this.updateBatchTimer) {
        this.updateBatchTimer = setTimeout(() => this.processUpdateBatch(), 1000);
      }

      itemsRepository.reorderItems(order);

      return { success: true, message: 'Order updated', order: itemsRepository.getSelectedOrder() };
    }

    return { success: false, error: 'Invalid action' };
  }

  getState() {
    return itemsRepository.getState();
  }
}

module.exports = new ItemsService();

