export interface QueueUpdateResultInterface {
  success: boolean;
  message?: string;
  error?: string;
  id?: number;
  order?: number[];
}
