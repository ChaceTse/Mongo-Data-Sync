const axios = require("axios");
const Config = require("./config");
const RedisUtil = require("./redisUtil");
const EJSON = require("mongodb-extended-json");
const {Timestamp} = require("bson");

const SyncDataService = {
  /**
   * 数据上传逻辑
   * @returns {Promise<void>}
   */
  uploadData: async () => {
    const uploadData = await RedisUtil.lrangeAsync(
      RedisUtil.REDIS_KEY_DATA_SYNC_OO_TO_CMS_Q,
      0,
      Config.remoteServer.maxChangeStreamCount - 1
    );
    if (uploadData && uploadData.length > 0) {
      const length = uploadData.length;
      let startAtOperationTime = EJSON.parse(
        uploadData[length - 1]
      ).clusterTime.toString();
      // 每隔一分钟记录startAtOperationTime时间
      const now = Date.now();
      if ((now - lastUploadTime) >= 60 * 1000) {
        lastUploadTime = now;
        console.log(`SyncDataService.uploadData startAtOperationTime: ${new Date( Timestamp.fromString(startAtOperationTime).getHighBits() * 1000)}`);
      }
      let configuration = {
        headers: {
          "x-api-key": Config.remoteServer.apiKey,
          "Content-Type": "application/json",
        },
      };
      let data = [];
      for (let i = 0; i < length; i++) {
        data.push(JSON.parse(uploadData[i]));
      }
      axios
        .post(Config.remoteServer.url, data, configuration)
        .then(() => {
          SyncDataService.updateQueueAndStartAt(startAtOperationTime, length);
        })
        .catch(async (err) => {
          console.error(`SyncDataService uploadData error, ${err}`);
          // 异常也需要先移除队列，重试失败再进失败的队列
          SyncDataService.updateQueueAndStartAt(startAtOperationTime, length);
          // 异常重试 + 重试不能解决移到failed 队列，定时处理
          // 数据处理方校验updateAt，此处不考虑打乱队列问题
          let retryTimes = 0;
          while (retryTimes < 5) {
            retryTimes++;
            console.error(
              `SyncDataService uploadData retry retryTimes, ${retryTimes}`
            );
            try {
              await axios.post(Config.remoteServer.url, data, configuration);
              break;
            } catch (retryErr) {
              console.error(
                `SyncDataService uploadData retry error, ${retryErr}`
              );
              // 重试的阈值，需要写入failed队列
              if (retryTimes === 5) {
                RedisUtil.lpushAsync(
                  RedisUtil.REDIS_KEY_DATA_SYNC_OO_TO_CMS_FAILED_Q,
                  JSON.stringify(data)
                );
              }
            }
          }
        });
    }
  },
  /**
   * 刷新startAtOperationTime
   * 修剪list
   * @param {*} startAtOperationTime
   * @param {*} length
   */
  updateQueueAndStartAt: (startAtOperationTime, length) => {
    if (startAtOperationTime) {
      // 上传成功，刷新startAtOperationTime
      RedisUtil.setAsync(
        RedisUtil.REDIS_KEY_DATA_SYNC_OO_TO_CMS_START_TIME,
        startAtOperationTime
      );
    }
    if (length > 0) {
      // 上传成功后 修剪list
      RedisUtil.ltrimAsync(
        RedisUtil.REDIS_KEY_DATA_SYNC_OO_TO_CMS_Q,
        length,
        -1
      );
    }
  },

  /**
   * 尝试重试failed队列里的请求
   */
  retryUpdateData: async () => {
    // 最多一次执行50条
    const uploadData = await RedisUtil.lrangeAsync(
      RedisUtil.REDIS_KEY_DATA_SYNC_OO_TO_CMS_FAILED_Q,
      0,
      49
    );
    if (uploadData && uploadData.length > 0) {
      const length = uploadData.length;
      let configuration = {
        headers: {
          "x-api-key": Config.remoteServer.apiKey,
          "Content-Type": "application/json",
        },
      };
      for (let i = 0; i < length; i++) {
        const data = JSON.parse(uploadData[i]);
        try {
          await axios.post(Config.remoteServer.url, data, configuration);
          // 正常调用，直接弹出
          RedisUtil.rpopAsync(RedisUtil.REDIS_KEY_DATA_SYNC_OO_TO_CMS_FAILED_Q);
        } catch (err) {
          // 异常调用，移到队尾
          RedisUtil.rpoplpushAsync(
            RedisUtil.REDIS_KEY_DATA_SYNC_OO_TO_CMS_FAILED_Q,
            RedisUtil.REDIS_KEY_DATA_SYNC_OO_TO_CMS_FAILED_Q
          );
          console.error(
            `SyncDataService uploadData schedule retry error, ${err}`
          );
        }
      }
    }
  },
};

let lastUploadTime = Date.now();

module.exports = SyncDataService;
