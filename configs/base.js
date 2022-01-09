const { Timestamp } = require("bson");

// 启动时手动传入断点续传的时间节点，默认该数值存入数据库，无需手动传入
const startAtOperationTimeStr = process.env.START_AT_OPERATION_TIME;

const Config = {
  // 服务是否需要开启change stream功能，默认开启
  enableChangeStreamListener: process.env.ENABLE_CHANGE_STREAM || true,
  // mongoDB的change stream 参数，参见 https://mongodb.github.io/node-mongodb-native/3.6/api/global.html#ChangeStreamOptions
  changeStreamsOptions: {
    fullDocument: "updateLookup",
    maxAwaitTimeMS: 60 * 1000,
    batchSize: 1000,
    readPreference: "secondaryPreferred",
    // resumeAfter: ResumeToken,
    // startAfter: ResumeToken,
    startAtOperationTime: startAtOperationTimeStr
      ? Timestamp.fromString(startAtOperationTimeStr)
      : undefined,
  },
  // 开启web端口用于模拟第三方数据接受端，如果仅用于数据上传，该web服务模块可以删除
  app: {
    port: 5565,
  },
  // 数据上传周期性任务频率  */30 * * * *  每隔30s执行一次
  scheduleCron: process.env.SCHEDULE_CRON || "*/2 * * * * ?",
  // 上传失败任务重试时周期性任务频率  1 * * * * ?    每分钟的第一秒执行一次
  scheduleFailedRetryCron: process.env.SCHEDULE_RETRY_CRON || "1 * * * * ?",
  newCollections: process.env.NEW_COLLECTIONS
};

module.exports = Config;
