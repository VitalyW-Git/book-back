import {ActionEnum} from "../enum/ActionEnum";

export interface QueueUpdateInterface {
    type: ActionEnum;
    id?: number;
    order?: number[];
}