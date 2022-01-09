const {createConnection, Schema} = require("mongoose");
const Config = require("../server/config");
const RedisUtil = require("../server/redisUtil");
const {Timestamp} = require("bson");
const EJSON = require('mongodb-extended-json');

const enableChangeStreamListener = eval(Config.enableChangeStreamListener);
// const changeStreamCollectionsStr =
//     Config.originalMongoDB.changeStreamCollections;
const dbAddress = Config.originalMongoDB.url;
const dbOptions = Config.originalMongoDB.options;
const MongodbUtil = {
    /**
     * 1、启动监听前情况队列中已有的数据
     * 2、启动时从上次上传成功的时间点开始监听
     * 3、将监听到的change  push到队列中
     */
    createChangeStream: async () => {
        if (!enableChangeStreamListener) {
            console.log(`enableChangeStreamListener createChangeStream: ${enableChangeStreamListener}`);
            return;
        }
        const [startTime] = await Promise.all([
            RedisUtil.getAsync(RedisUtil.REDIS_KEY_DATA_SYNC_OO_TO_CMS_START_TIME),
        ]);
        // const changeStreamCollections = changeStreamCollectionsStr.split("|");
        if (!Config.changeStreamsOptions.startAtOperationTime && startTime) {
            Object.assign(Config.changeStreamsOptions, {
                startAtOperationTime: Timestamp.fromString(startTime),
            });
        }
        // 如果存在断点续传节点，则将队列清空
        if (Config.changeStreamsOptions.startAtOperationTime) {
            RedisUtil.delAsync(RedisUtil.REDIS_KEY_DATA_SYNC_OO_TO_CMS_Q);
        }
        /**
         * 针对单个collection监听
         */
        // changeStreamCollections.forEach((collection) => {
        //   console.log(`**********changeStreamCollections: ${collection}`);
        //   createCollectionChangeStream(collection);
        // });

        /**
         * 针对整个db监听
         */
        await createCollectionChangeStream();
    },
};

const createCollectionChangeStream = async (collection) => {
    const conn = await createConnection(dbAddress, dbOptions);
    console.log(`Config.changeStreamsOptions: ${Config.changeStreamsOptions.startAtOperationTime.getHighBits()}, ${JSON.stringify(Config.changeStreamsOptions)}`);
    let changeStream;
    if (!collection) {
        changeStream = conn.watch([], Config.changeStreamsOptions);
    } else {
        const collModel = conn.model(collection, new Schema(), collection);
        changeStream = collModel.watch([], Config.changeStreamsOptions);
    }
    pushStreamToRedis(changeStream);
};

/**
 * 将更新消息推送到redis队列
 * @param changeStream
 */
const pushStreamToRedis = (changeStream) => {
    changeStream.on("change", (next) => {
        RedisUtil.rpushAsync(
            RedisUtil.REDIS_KEY_DATA_SYNC_OO_TO_CMS_Q,
            EJSON.stringify(next)
        );
    });
}

module.exports = MongodbUtil;
