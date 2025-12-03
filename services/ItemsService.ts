import itemsRepository from '../repositories/ItemsRepository';
import {
  ItemsResponseInterface,
  SelectedItemsResponseInterface,
  QueueAddItemResultInterface,
  QueueUpdateResultInterface,
  QueueItemInterface,
  QueueUpdateInterface,
  StateResponseInterface
} from '../types/interface';

class ItemsService {
  private requestQueue: {
    add: Map<string, { id: number }>;
    get: Map<string, QueueItemInterface>;
    update: Map<string, QueueUpdateInterface>;
  };
  private addBatchTimer: NodeJS.Timeout | null;
  private getBatchTimer: NodeJS.Timeout | null;
  private updateBatchTimer: NodeJS.Timeout | null;

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

  private processAddBatch(): void {
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

  private processGetBatch(): void {
    if (this.requestQueue.get.size === 0) {
      this.getBatchTimer = null;
      return;
    }

    this.requestQueue.get.clear();
    this.getBatchTimer = setTimeout(() => this.processGetBatch(), 1000);
  }

  private processUpdateBatch(): void {
    if (this.requestQueue.update.size === 0) {
      this.updateBatchTimer = null;
      return;
    }

    const updates = Array.from(this.requestQueue.update.values());
    this.requestQueue.update.clear();

    updates.forEach(update => {
      if (update.type === 'select' && update.id !== undefined) {
        itemsRepository.selectItem(update.id);
      } else if (update.type === 'deselect' && update.id !== undefined) {
        itemsRepository.deselectItem(update.id);
      } else if (update.type === 'reorder' && update.order !== undefined) {
        itemsRepository.reorderItems(update.order);
      }
    });

    this.updateBatchTimer = setTimeout(() => this.processUpdateBatch(), 1000);
  }

  private paginateItems<T>(
    items: T[],
    page: number,
    limit: number): { paginatedItems: T[], start: number }
  {
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedItems = items.slice(start, end);
    return { paginatedItems, start};
  }

  private addToGetQueue(queueKey: string, queueData: QueueItemInterface): void {
    if (!this.requestQueue.get.has(queueKey)) {
      this.requestQueue.get.set(queueKey, queueData);
      if (!this.getBatchTimer) {
        this.getBatchTimer = setTimeout(() => this.processGetBatch(), 1000);
      }
    }
  }

  getItems(
      page: number,
      limit: number,
      filterId: number | null,
  ): ItemsResponseInterface {
    let items = itemsRepository.getAllItems();

    if (filterId) {
      items = items.filter(item => item.id.toString().includes(filterId.toString()));
    }

    const selectedItems = itemsRepository.getSelectedItems();
    items = items.filter(item => !selectedItems.has(item.id));

    items.sort((a, b) => a.id - b.id);

    const { paginatedItems } = this.paginateItems(items, page, limit);

    const queueKey = `item-${page}-${limit}-${filterId}`;
    this.addToGetQueue(queueKey, { page, limit, filterId });

    return {
      items: paginatedItems,
      total: items.length,
      page,
      limit,
    };
  }

  getSelectedItems(
      page: number,
      limit: number,
      filterId: number | null
  ): SelectedItemsResponseInterface {
    let items = itemsRepository.getSelectedAllItems();

    if (filterId) {
      items = items.filter(item => item.id.toString().includes(filterId.toString()));
    }

    const { paginatedItems } = this.paginateItems(items, page, limit);

    const queueKey = `selected-${page}-${limit}-${filterId}`;
    this.addToGetQueue(queueKey, { page, limit, filterId, selected: true });

    return {
      items: paginatedItems,
      total: items.length,
      page,
      limit,
      order: itemsRepository.getSelectedOrder()
    };
  }

  queueAddItem(id: number): QueueAddItemResultInterface {
    const queueKey = `add-${id}`;
    if (this.requestQueue.add.has(queueKey)) {
      return { queued: false, message: '"Элемент" уже в очереди', id };
    }

    const maxId = itemsRepository.getMaxId();
    if (id <= maxId || itemsRepository.hasItem(id)) {
      return { queued: false, error: 'Элемент с таким идентификатором уже существует' };
    }

    const newItem = { id };
    this.requestQueue.add.set(queueKey, newItem);

    if (!this.addBatchTimer) {
      this.addBatchTimer = setTimeout(() => this.processAddBatch(), 10000);
    }

    return { queued: true, message: 'Элемент поставлен в очередь на добавление', id };
  }

  queueUpdateSelection(
      action: 'select' | 'deselect' | 'reorder',
      id?: number, order?: number[]
  ): QueueUpdateResultInterface {
    if (action === 'select' || action === 'deselect') {
      if (id === undefined) {
        return { success: false, error: 'Для выбора/отмены выбора требуется идентификатор' };
      }

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
      if (order === undefined) {
        return { success: false, error: 'Требуется указать порядок' };
      }

      const queueKey = 'reorder';
      this.requestQueue.update.set(queueKey, { type: 'reorder', order });
      if (!this.updateBatchTimer) {
        this.updateBatchTimer = setTimeout(() => this.processUpdateBatch(), 1000);
      }

      itemsRepository.reorderItems(order);

      return { success: true, message: 'Сортировка обновлена', order: itemsRepository.getSelectedOrder() };
    }

    return { success: false, error: 'Неверные параметры' };
  }

  getState(): StateResponseInterface {
    return itemsRepository.getState();
  }
}

export default new ItemsService();

