export interface QueueUpdateInterface {
    type: 'select' | 'deselect' | 'reorder';
    id?: number;
    order?: number[];
}