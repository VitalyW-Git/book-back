import { QueueItemInterface } from "./QueueItemInterface";
import { QueueUpdateInterface } from "./QueueUpdateInterface";

export interface RequestQueueInterface {
  add: Map<string, { id: number }>;
  get: Map<string, QueueItemInterface>;
  update: Map<string, QueueUpdateInterface>;
}
