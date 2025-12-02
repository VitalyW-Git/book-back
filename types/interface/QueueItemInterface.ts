export interface QueueItemInterface {
    page?: number;
    limit?: number;
    filterId?: number | null;
    excludeSelected?: boolean;
    selected?: boolean;
}