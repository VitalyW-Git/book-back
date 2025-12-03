import itemsRepository from "../repositories/ItemsRepository";
import {
  ItemsResponseInterface,
  SelectedItemsResponseInterface,
  QueueAddItemResultInterface,
  QueueUpdateResultInterface,
  QueueItemInterface,
  RequestQueueInterface,
} from "../types/interface";
import { ActionEnum } from "../types/enum/ActionEnum";

class ItemsService {
  private requestQueue: RequestQueueInterface = {
    add: new Map(),
    get: new Map(),
    update: new Map(),
  };
  private addBatchTimer: NodeJS.Timeout | null = null;
  private getBatchTimer: NodeJS.Timeout | null = null;
  private updateBatchTimer: NodeJS.Timeout | null = null;

  constructor() {}

  private processAddBatch(): void {
    if (this.requestQueue.add.size === 0) {
      this.addBatchTimer = null;
      return;
    }

    const itemsToAdd = Array.from(this.requestQueue.add.values());
    this.requestQueue.add.clear();

    itemsToAdd.forEach((item) => {
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

    updates.forEach((update) => {
      if (update.type === ActionEnum.SELECT && update.id !== undefined) {
        itemsRepository.selectItem(update.id);
      } else if (
        update.type === ActionEnum.DESELECT &&
        update.id !== undefined
      ) {
        itemsRepository.deselectItem(update.id);
      } else if (
        update.type === ActionEnum.REORDER &&
        update.order !== undefined
      ) {
        itemsRepository.reorderItems(update.order);
      }
    });

    this.updateBatchTimer = setTimeout(() => this.processUpdateBatch(), 1000);
  }

  private paginateItems<T>(
    items: T[],
    page: number,
    limit: number
  ): { paginatedItems: T[]; start: number } {
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedItems = items.slice(start, end);
    return { paginatedItems, start };
  }

  private addToGetQueue(queueKey: string, queueData: QueueItemInterface): void {
    if (!this.requestQueue.get.has(queueKey)) {
      this.requestQueue.get.set(queueKey, queueData);
      if (!this.getBatchTimer) {
        this.getBatchTimer = setTimeout(() => this.processGetBatch(), 1000);
      }
    }
  }

  public getItems(
    page: number,
    limit: number,
    filterId: number | null
  ): ItemsResponseInterface {
    let items = itemsRepository.getAllItems();

    if (filterId) {
      items = items.filter((item) =>
        item.id.toString().includes(filterId.toString())
      );
    }

    const selectedItems = itemsRepository.getSelectedItems();
    items = items
      .filter((item) => !selectedItems.has(item.id))
      .sort((a, b) => a.id - b.id);

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

  public getSelectedItems(
    page: number,
    limit: number,
    filterId: number | null
  ): SelectedItemsResponseInterface {
    let items = itemsRepository.getSelectedAllItems();

    if (filterId) {
      items = items.filter((item) =>
        item.id.toString().includes(filterId.toString())
      );
    }

    const { paginatedItems } = this.paginateItems(items, page, limit);

    const queueKey = `selected-${page}-${limit}-${filterId}`;
    this.addToGetQueue(queueKey, { page, limit, filterId, selected: true });

    return {
      items: paginatedItems,
      total: items.length,
      page,
      limit,
      order: itemsRepository.getSelectedOrder(),
    };
  }

  public queueAddItem(id: number): QueueAddItemResultInterface {
    const queueKey = `add-${id}`;
    if (this.requestQueue.add.has(queueKey)) {
      return { queued: false, message: '"Элемент" уже в очереди', id };
    }

    const maxId = itemsRepository.getMaxId();
    if (id <= maxId || itemsRepository.hasItem(id)) {
      return { queued: false, error: `Элемент с ID ${id}  уже существует` };
    }

    const newItem = { id };
    this.requestQueue.add.set(queueKey, newItem);

    if (!this.addBatchTimer) {
      this.addBatchTimer = setTimeout(() => this.processAddBatch(), 10000);
    }

    return {
      queued: true,
      message: "Элемент поставлен в очередь на добавление",
      id,
    };
  }

  public queueUpdateSelection(
    action: ActionEnum,
    id?: number,
    order?: number[]
  ): QueueUpdateResultInterface {
    if (action === ActionEnum.SELECT || action === ActionEnum.DESELECT) {
      if (!id) {
        return {
          success: false,
          error: "Для выбора/отмены требуется идентификатор",
        };
      }

      const queueKey = `${action}-${id}`;
      if (!this.requestQueue.update.has(queueKey)) {
        this.requestQueue.update.set(queueKey, { type: action, id });
        if (!this.updateBatchTimer) {
          this.updateBatchTimer = setTimeout(
            () => this.processUpdateBatch(),
            1000
          );
        }
      }

      if (action === ActionEnum.SELECT) {
        itemsRepository.selectItem(id);
      } else {
        itemsRepository.deselectItem(id);
      }

      return { success: true, message: `Item ${action}ed`, id };
    } else if (action === ActionEnum.REORDER) {
      if (!order?.length) {
        return { success: false, error: "Требуется указать порядок" };
      }
      this.requestQueue.update.set(ActionEnum.REORDER, {
        type: ActionEnum.REORDER,
        order,
      });
      if (!this.updateBatchTimer) {
        this.updateBatchTimer = setTimeout(
          () => this.processUpdateBatch(),
          1000
        );
      }

      itemsRepository.reorderItems(order);

      return {
        success: true,
        message: "Сортировка обновлена",
        order: itemsRepository.getSelectedOrder(),
      };
    }

    return { success: false, error: "Неверные параметры" };
  }
}

export default new ItemsService();
