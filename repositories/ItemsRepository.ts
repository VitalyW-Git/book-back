import { ItemInterface } from "../types/interface";
import { MAX_ID_CONSTANT } from "../types/constant";

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

  public getAllItems(): ItemInterface[] {
    return Array.from(this.allItems.values());
  }

  public getSelectedAllItems(): ItemInterface[] {
    return this.selectedOrder
      .filter((id) => this.selectedItems.has(id))
      .map((id) => this.allItems.get(id))
      .filter((item): item is ItemInterface => item !== undefined);
  }

  public hasItem(id: number): boolean {
    return this.allItems.has(id);
  }

  public addItem(item: ItemInterface): boolean {
    if (!this.allItems.has(item.id)) {
      this.allItems.set(item.id, item);
      if (item.id >= this.nextId) {
        this.nextId = item.id + 1;
      }
      return true;
    }
    return false;
  }

  public selectItem(id: number): void {
    this.selectedItems.add(id);
    if (!this.selectedOrder.includes(id)) {
      this.selectedOrder.push(id);
    }
  }

  public deselectItem(id: number): void {
    this.selectedItems.delete(id);
    this.selectedOrder = this.selectedOrder.filter((itemId) => itemId !== id);
  }

  public reorderItems(order: number[]): void {
    this.selectedOrder = order.filter((id) => this.selectedItems.has(id));
  }

  public getSelectedItems(): Set<number> {
    return this.selectedItems;
  }

  public getSelectedOrder(): number[] {
    return this.selectedOrder;
  }

  public getMaxId(): number {
    return MAX_ID_CONSTANT;
  }
}

export default new ItemsRepository();
