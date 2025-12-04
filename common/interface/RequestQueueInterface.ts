import { QueueItemInterface } from "./QueueItemInterface";
import { QueueUpdateInterface } from "./QueueUpdateInterface";
import { ItemInterface } from "./ItemInterface";

export interface RequestQueueInterface {
  add: Map<string, ItemInterface>;
  get: Map<string, QueueItemInterface>;
  update: Map<string, QueueUpdateInterface>;
}
