const MAX_ID = 1000000;

class ItemsRepository {
  constructor() {
    this.selectedItems = new Set();
    this.selectedOrder = [];
    this.allItems = new Map();
    this.nextId = 1000001;
    this.initializeItems();
  }

  initializeItems() {
    console.log('Инициализация элементов...');
    for (let i = 1; i <= MAX_ID; i++) {
      this.allItems.set(i, { id: i });
    }
    console.log('Инициализация завершена');
  }

  getItem(id) {
    return this.allItems.get(id);
  }

  getAllItems() {
    return Array.from(this.allItems.values());
  }

  hasItem(id) {
    return this.allItems.has(id);
  }

  addItem(item) {
    if (!this.allItems.has(item.id)) {
      this.allItems.set(item.id, item);
      if (item.id >= this.nextId) {
        this.nextId = item.id + 1;
      }
      return true;
    }
    return false;
  }

  isSelected(id) {
    return this.selectedItems.has(id);
  }

  selectItem(id) {
    this.selectedItems.add(id);
    if (!this.selectedOrder.includes(id)) {
      this.selectedOrder.push(id);
    }
  }

  deselectItem(id) {
    this.selectedItems.delete(id);
    this.selectedOrder = this.selectedOrder.filter(itemId => itemId !== id);
  }

  reorderItems(order) {
    this.selectedOrder = order.filter(id => this.selectedItems.has(id));
  }

  getSelectedItems() {
    return this.selectedOrder
      .filter(id => this.selectedItems.has(id))
      .map(id => this.allItems.get(id))
      .filter(item => item !== undefined);
  }

  getSelectedItemsSet() {
    return this.selectedItems;
  }

  getSelectedOrder() {
    return this.selectedOrder;
  }

  getState() {
    return {
      selectedItems: Array.from(this.selectedItems),
      selectedOrder: this.selectedOrder
    };
  }

  getMaxId() {
    return MAX_ID;
  }

  getNextId() {
    return this.nextId;
  }
}

module.exports = new ItemsRepository();

