const Config = {
  // 需要同步数据的MongoDB参数
  originalMongoDB: {
    url:
      process.env.MONGODB_URL || "mongodb://localhost:27017/order-online",
    changeStreamCollections:
      process.env.CHANGE_STREAM_COLLECTIONS || "Order|Payment|Transaction",
    options: {
      poolSize: 10,
      readPreference: process.env.MONGO_READ_PREFERENCE || "secondaryPreferred", //读偏好设置
      useNewUrlParser: true,
      replicaSet: process.env.MONGO_RS_NAME,
      useCreateIndex: false,
      useUnifiedTopology: true
    },
  },
  // 接受数据的第三方服务的服务参数
  remoteServer: {
    url: process.env.REMOTE_API_URL || "http://localhost:5565/uploadtests",
    method: "POST",
    apiKey: process.env.REMOTE_API_KEY || "",
    // 每次上传数据包的最大长度
    maxChangeStreamCount: process.env.REMOTE_API_SYNC_MAX_COUNT || 500,
  },
  app: {
    port: 5565,
  },
  // redis用作队列，记录每条变更的数据
  redis: {
    masterURL: process.env.REDIS_MASTER_URL || "redis://127.0.0.1:6379",
    readOnlyURL: process.env.REDIS_READ_ONLY_URL || "redis://127.0.0.1:6379",
    // 定时任务锁的锁时间
    expire: {
      taskLock: process.env.REDIS_TASK_EXPIRE || 2 * 60,
    },
  },
};

module.exports = Config;
