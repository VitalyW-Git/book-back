import {ItemInterface} from "./ItemInterface";

export interface ItemsResponseInterface {
    items: ItemInterface[];
    total: number;
    page: number;
    limit: number;
}