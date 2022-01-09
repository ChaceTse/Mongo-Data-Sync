const Config = {
  originalMongoDB: {
    url: process.env.MONGODB_URL,
    changeStreamCollections: process.env.CHANGE_STREAM_COLLECTIONS,
    options: {
        poolSize: 10,
        readPreference: process.env.MONGO_READ_PREFERENCE || "secondaryPreferred", //读偏好设置
        useNewUrlParser: true,
        replicaSet: process.env.MONGO_RS_NAME,
        useCreateIndex: false,
        useUnifiedTopology: true
      },
  },
  remoteServer: {
    url: process.env.REMOTE_API_URL,
    method: "POST",
    apiKey: process.env.REMOTE_API_KEY || "",
    maxChangeStreamCount: process.env.REMOTE_API_SYNC_MAX_COUNT || 100,
  },
  app: {
    port: 80,
  },
  redis: {
    masterURL: process.env.REDIS_MASTER_URL,
    readOnlyURL: process.env.REDIS_READ_ONLY_URL,
    expire: {
      taskLock: process.env.REDIS_TASK_EXPIRE || 2 * 60,
    },
  },
};

module.exports = Config;
