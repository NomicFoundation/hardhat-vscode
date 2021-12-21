import * as events from "events";

export type IndexFileData = {
  path: string;
  current: number;
  total: number;
};

export const eventEmitter = new events.EventEmitter();
