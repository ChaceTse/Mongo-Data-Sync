const express = require('express');
const MongodbUtil = require("./database/database");
const heartbeatRouter = require('./routes/heartbeat');
const Scheduler = require('./server/scheduler');

const app = express();

app.use(express.json({limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '2mb' }));

app.use('/', heartbeatRouter);

// 监听mongodb数据更新流
MongodbUtil.createChangeStream();

// 启动定时同步任务
Scheduler.scheduleTask();


module.exports = app;
