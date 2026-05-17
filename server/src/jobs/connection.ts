import IORedis from "ioredis";
import { env } from "../config/env";
import { logger } from "../utils/logger";

let connection: IORedis | undefined;

export const getRedisConnection = (): IORedis => {
  if (!connection) {
    connection = new IORedis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      db: env.REDIS_DB,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    connection.on("error", (error) => {
      logger.warn("Redis connection error", { error: error.message });
    });
  }

  return connection;
};

export const closeRedisConnection = async (): Promise<void> => {
  if (connection) {
    await connection.quit();
    connection = undefined;
  }
};
