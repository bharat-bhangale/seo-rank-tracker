import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { getGscSyncQueue, getRankChecksQueue } from "./queues";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(getRankChecksQueue()), new BullMQAdapter(getGscSyncQueue())],
  serverAdapter,
});

export const bullBoardRouter = serverAdapter.getRouter();
