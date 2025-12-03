import { ItemsResponseInterface } from "./ItemsResponseInterface";

export interface SelectedItemsResponseInterface extends ItemsResponseInterface {
  order: number[];
}
