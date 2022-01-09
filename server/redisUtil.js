const { promisify } = require("util");
const { masterClient, readOnlyClient } = require("../database/redis");

const RedisUtil = {
  // 每条数据变更队列的key
  REDIS_KEY_DATA_SYNC_OO_TO_CMS_Q: "DATA:SYNC:OO_TO_CMS:Q",
  // 上传失败数据队列的key
  REDIS_KEY_DATA_SYNC_OO_TO_CMS_FAILED_Q: "DATA:SYNC:OO_TO_CMS:FAIL:Q",
  // 记录断点续传的断点数据
  REDIS_KEY_DATA_SYNC_OO_TO_CMS_START_TIME: "DATA:SYNC:OO_TO_CMS:ST_TI",
  // 数据上传时锁的key
  REDIS_KEY_DATA_SYNC_OO_TO_CMS_LOCK: "DATA:SYNC:OO_TO_CMS:LOCK",
  // 重试失败数据锁的key
  REDIS_KEY_DATA_SYNC_OO_TO_CMS_FAILED_LOCK: "DATA:SYNC:OO_TO_CMS:FAIL:LOCK",

  getAsync: promisify(readOnlyClient.get).bind(readOnlyClient),
  setAsync: promisify(masterClient.set).bind(masterClient),
  rpushAsync: promisify(masterClient.rpush).bind(masterClient),
  lpushAsync: promisify(masterClient.lpush).bind(masterClient),
  rpoplpushAsync: promisify(masterClient.rpoplpush).bind(masterClient),
  rpopAsync: promisify(masterClient.rpop).bind(masterClient),
  lrangeAsync: promisify(readOnlyClient.lrange).bind(readOnlyClient),
  delAsync: promisify(masterClient.del).bind(masterClient),
  ltrimAsync: promisify(masterClient.ltrim).bind(masterClient),
  expireAsync: promisify(masterClient.expire).bind(masterClient),
  setnxAsync: promisify(masterClient.setnx).bind(masterClient),
  tryLock: async (key, value, expire) => {
    const lock = await RedisUtil.setnxAsync(key, value || "lock message");
    if (lock) {
      RedisUtil.expireAsync(key, expire || 1 * 60);
    } else {
      console.log(`try lock failed, key: ${key}`);
    }
    return lock === 1;
  },
  unLock: async (key) => {
    RedisUtil.delAsync(key);
  },
};

module.exports = RedisUtil;
