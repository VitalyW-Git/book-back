import { ItemInterface, StateResponseInterface } from '../types/interface';
import { MAX_ID_CONSTANT } from "../types/constant";

class ItemsRepository {
  private selectedItems: Set<number>;
  private selectedOrder: number[];
  private allItems: Map<number, ItemInterface>;
  private nextId: number;

  constructor() {
    this.selectedItems = new Set();
    this.selectedOrder = [];
    this.allItems = new Map();
    this.nextId = 1000001;
    this.initializeItems();
  }

  private initializeItems(): void {
    console.log('Инициализация элементов...');
    for (let i = 1; i <= MAX_ID_CONSTANT; i++) {
      this.allItems.set(i, { id: i });
    }
    console.log('Инициализация завершена');
  }

  getAllItems(): ItemInterface[] {
    return Array.from(this.allItems.values());
  }

  hasItem(id: number): boolean {
    return this.allItems.has(id);
  }

  addItem(item: ItemInterface): boolean {
    if (!this.allItems.has(item.id)) {
      this.allItems.set(item.id, item);
      if (item.id >= this.nextId) {
        this.nextId = item.id + 1;
      }
      return true;
    }
    return false;
  }

  isSelected(id: number): boolean {
    return this.selectedItems.has(id);
  }

  selectItem(id: number): void {
    this.selectedItems.add(id);
    if (!this.selectedOrder.includes(id)) {
      this.selectedOrder.push(id);
    }
  }

  deselectItem(id: number): void {
    this.selectedItems.delete(id);
    this.selectedOrder = this.selectedOrder.filter(itemId => itemId !== id);
  }

  reorderItems(order: number[]): void {
    this.selectedOrder = order.filter(id => this.selectedItems.has(id));
  }

  getSelectedItems(): ItemInterface[] {
    return this.selectedOrder
      .filter(id => this.selectedItems.has(id))
      .map(id => this.allItems.get(id))
      .filter((item): item is ItemInterface => item !== undefined);
  }

  getSelectedItemsSet(): Set<number> {
    return this.selectedItems;
  }

  getSelectedOrder(): number[] {
    return this.selectedOrder;
  }

  getState(): StateResponseInterface {
    return {
      selectedItems: Array.from(this.selectedItems),
      selectedOrder: this.selectedOrder
    };
  }

  getMaxId(): number {
    return MAX_ID_CONSTANT;
  }

  getNextId(): number {
    return this.nextId;
  }
}

export default new ItemsRepository();

