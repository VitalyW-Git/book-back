export interface Item {
  id: number;
}

export interface ItemsResponse {
  items: Item[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SelectedItemsResponse extends ItemsResponse {
  order: number[];
}

export interface AddItemRequest {
  id: number;
}

export interface AddItemResponse {
  message: string;
  id: number;
}

export interface UpdateSelectionRequest {
  action: 'select' | 'deselect' | 'reorder';
  id?: number;
  order?: number[];
}

export interface UpdateSelectionResponse {
  message: string;
  id?: number;
  order?: number[];
}

export interface StateResponse {
  selectedItems: number[];
  selectedOrder: number[];
}

export interface QueueAddItemResult {
  queued: boolean;
  message?: string;
  error?: string;
  id?: number;
}

export interface QueueUpdateResult {
  success: boolean;
  message?: string;
  error?: string;
  id?: number;
  order?: number[];
}

export interface QueueItem {
  page?: number;
  limit?: number;
  filterId?: number | null;
  excludeSelected?: boolean;
  selected?: boolean;
}

export interface QueueUpdate {
  type: 'select' | 'deselect' | 'reorder';
  id?: number;
  order?: number[];
}

