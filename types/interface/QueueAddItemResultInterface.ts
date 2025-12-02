export interface QueueAddItemResultInterface {
    queued: boolean;
    message?: string;
    error?: string;
    id?: number;
}