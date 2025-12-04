import itemsRepository from "../repositories/ItemsRepository";
import {
  ItemsResponseInterface,
  SelectedItemsResponseInterface,
  QueueAddItemResultInterface,
  QueueUpdateResultInterface,
  QueueItemInterface,
  RequestQueueInterface,
  ItemInterface,
  QueueUpdateInterface,
} from "../common/interface";
import { ActionEnum } from "../common/enum/ActionEnum";

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

  private async processAddBatch(): Promise<void> {
    if (this.requestQueue.add.size === 0) {
      this.addBatchTimer = null;
      return;
    }

    const itemsToAdd = Array.from(this.requestQueue.add.values());
    this.requestQueue.add.clear();

    try {
      await Promise.all(
        itemsToAdd.map((item: ItemInterface) => itemsRepository.addItem(item))
      );
    } catch (error) {
      console.error("Ошибка при обработке добавления:", error);
    }

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

  private async processUpdateBatch(): Promise<void> {
    if (this.requestQueue.update.size === 0) {
      this.updateBatchTimer = null;
      return;
    }

    const updates = Array.from(this.requestQueue.update.values());
    this.requestQueue.update.clear();

    try {
      await Promise.all(
        updates.map(async (update: QueueUpdateInterface) => {
          if (update.type === ActionEnum.SELECT && update.id) {
            await itemsRepository.selectItem(update.id);
          } else if (update.type === ActionEnum.DESELECT && update.id) {
            await itemsRepository.deselectItem(update.id);
          } else if (
            update.type === ActionEnum.REORDER &&
            !!update.order?.length
          ) {
            await itemsRepository.reorderItems(update.order);
          }
        })
      );
    } catch (error) {
      console.error("Ошибка при обработке обновления:", error);
    }

    this.updateBatchTimer = setTimeout(() => this.processUpdateBatch(), 1000);
  }

  private async paginateItems<T>(
    items: T[],
    page: number,
    limit: number
  ): Promise<{ paginatedItems: T[]; start: number }> {
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

  public async getItems(
    page: number,
    limit: number,
    filterId: number | null
  ): Promise<ItemsResponseInterface> {
    let items = await itemsRepository.getAllItems();

    if (filterId) {
      items = items.filter((item) =>
        item.id.toString().includes(filterId.toString())
      );
    }

    const selectedItems = await itemsRepository.getSelectedItems();
    items = items
      .filter((item: ItemInterface) => !selectedItems.has(item.id))
      .sort((a: ItemInterface, b: ItemInterface) => a.id - b.id);

    const { paginatedItems } = await this.paginateItems(items, page, limit);

    const queueKey = `item-${page}-${limit}-${filterId}`;
    this.addToGetQueue(queueKey, { page, limit, filterId });

    return {
      items: paginatedItems,
      total: items.length,
      page,
      limit,
    };
  }

  public async getSelectedItems(
    page: number,
    limit: number,
    filterId: number | null
  ): Promise<SelectedItemsResponseInterface> {
    let items = await itemsRepository.getSelectedAllItems();

    if (filterId) {
      items = items.filter((item) =>
        item.id.toString().includes(filterId.toString())
      );
    }

    const { paginatedItems } = await this.paginateItems(items, page, limit);

    const queueKey = `selected-${page}-${limit}-${filterId}`;
    this.addToGetQueue(queueKey, { page, limit, filterId, selected: true });

    return {
      items: paginatedItems,
      total: items.length,
      page,
      limit,
      order: await itemsRepository.getSelectedOrder(),
    };
  }

  public async queueAddItem(id: number): Promise<QueueAddItemResultInterface> {
    const queueKey = `add-${id}`;
    if (this.requestQueue.add.has(queueKey)) {
      return { queued: false, message: '"Элемент" уже в очереди', id };
    }

    const maxId = itemsRepository.getMaxId();
    if (id <= maxId || itemsRepository.hasItem(id)) {
      return { queued: false, error: `"Элемент" с ID ${id} уже существует` };
    }

    this.requestQueue.add.set(queueKey, { id });

    if (!this.addBatchTimer) {
      this.addBatchTimer = setTimeout(() => this.processAddBatch(), 10000);
    }

    return {
      queued: true,
      message: `"Элемент" поставлен в очередь на добавление`,
      id,
    };
  }

  public async queueUpdateSelection(
    action: ActionEnum,
    id?: number,
    order?: number[]
  ): Promise<QueueUpdateResultInterface> {
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
        await itemsRepository.selectItem(id);
      } else {
        await itemsRepository.deselectItem(id);
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

      await itemsRepository.reorderItems(order);

      return {
        success: true,
        message: "Сортировка обновлена",
        order: await itemsRepository.getSelectedOrder(),
      };
    }

    return { success: false, error: "Неверные параметры" };
  }
}

export default new ItemsService();
