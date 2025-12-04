import { ItemInterface } from "../common/interface";
import { MAX_ID_CONSTANT } from "../common/constant";

class ItemsRepository {
  private selectedItems: Set<number> = new Set();
  private selectedOrder: number[] = [];
  private allItems: Map<number, ItemInterface> = new Map();
  private nextId: number = 1000001;

  constructor() {
    this.initializeItems();
  }

  private initializeItems(): void {
    console.log("Инициализация элементов...");
    for (let i = 1; i <= MAX_ID_CONSTANT; i++) {
      this.allItems.set(i, { id: i });
    }
    console.log("Инициализация завершена");
  }

  public async getAllItems(): Promise<ItemInterface[]> {
    return Array.from(this.allItems.values());
  }

  public async getSelectedAllItems(): Promise<ItemInterface[]> {
    return this.selectedOrder
      .filter((id) => this.selectedItems.has(id))
      .map((id) => this.allItems.get(id))
      .filter((item): item is ItemInterface => item !== undefined);
  }

  public hasItem(id: number): boolean {
    return this.allItems.has(id);
  }

  public async addItem(item: ItemInterface): Promise<boolean> {
    if (!this.allItems.has(item.id)) {
      this.allItems.set(item.id, item);
      if (item.id >= this.nextId) {
        this.nextId = item.id + 1;
      }
      return true;
    }
    return false;
  }

  public async selectItem(id: number): Promise<void> {
    this.selectedItems.add(id);
    if (!this.selectedOrder.includes(id)) {
      this.selectedOrder.push(id);
    }
  }

  public async deselectItem(id: number): Promise<void> {
    this.selectedItems.delete(id);
    this.selectedOrder = this.selectedOrder.filter((itemId) => itemId !== id);
  }

  public async reorderItems(order: number[]): Promise<void> {
    this.selectedOrder = order.filter((id) => this.selectedItems.has(id));
  }

  public async getSelectedItems(): Promise<Set<number>> {
    return this.selectedItems;
  }

  public async getSelectedOrder(): Promise<number[]> {
    return this.selectedOrder;
  }

  public getMaxId(): number {
    return MAX_ID_CONSTANT;
  }
}

export default new ItemsRepository();
