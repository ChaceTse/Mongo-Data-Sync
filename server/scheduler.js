const schedule = require("node-schedule");
const Config = require("./config");
const RedisUtil = require("./redisUtil");
const SyncDataService = require("./syncDataService");

const Scheduler = {
  scheduleTask: () => {
    const enableChangeStreamListener = eval(Config.enableChangeStreamListener);
    if (!enableChangeStreamListener) {
      console.log(`enableChangeStreamListener scheduleTask: ${enableChangeStreamListener}`);
      return;
    }
    uploadData();
    retryFailedRequest();
  },
};

/**
 * 数据上传的定时任务
 */
const uploadData = () => {
  schedule.scheduleJob(Config.scheduleCron, async () => {
    // 加锁，避免重复执行
    const lock = await RedisUtil.tryLock(
      RedisUtil.REDIS_KEY_DATA_SYNC_OO_TO_CMS_LOCK,
      "lock message",
      Config.redis.expire.taskLock
    );
    if (lock) {
      try {
        await SyncDataService.uploadData();
      } catch (err) {
        console.error(`SyncDataService.uploadData error: ${error}`);
      } finally {
        RedisUtil.unLock(RedisUtil.REDIS_KEY_DATA_SYNC_OO_TO_CMS_LOCK);
      }
    }
  });
};

/**
 * 上传失败的重试定时任务
 */
const retryFailedRequest = () => {
  schedule.scheduleJob(Config.scheduleFailedRetryCron, async () => {
    // 加锁，避免重复执行
    const lock = await RedisUtil.tryLock(
      RedisUtil.REDIS_KEY_DATA_SYNC_OO_TO_CMS_FAILED_LOCK,
      "lock message",
      Config.redis.expire.taskLock
    );
    if (lock) {
      try {
        await SyncDataService.retryUpdateData();
      } catch (err) {
        console.error(`SyncDataService.retryUpdateData error: ${err}`);
      } finally {
        RedisUtil.unLock(RedisUtil.REDIS_KEY_DATA_SYNC_OO_TO_CMS_FAILED_LOCK);
      }
    }
  });
};

module.exports = Scheduler;
