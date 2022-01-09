const redis = require("redis");
const Config = require("../server/config");

const masterClient = redis.createClient({
  url: Config.redis.masterURL,
});

const readOnlyClient = redis.createClient({
  url: Config.redis.readOnlyURL,
});

masterClient.on("connect", () => {
  console.log("Redis is connected!");
});

masterClient.on("ready", async () => {
  console.log("Redis is ready!");
});

masterClient.on("error", (e) => {
  console.log("Redis error! " + e);
});

masterClient.on("end", (err) => {
  console.log("Redis end!");
});
// read only
readOnlyClient.on("connect", () => {
  console.log("Read Only Redis is connected!");
});

readOnlyClient.on("ready", async () => {
  console.log("Read Only Redis is ready!");
});

readOnlyClient.on("error", (e) => {
  console.log("Read Only Redis error! " + e);
});

readOnlyClient.on("end", (err) => {
  console.log("Read Only Redis end!");
});

module.exports = {
  masterClient,
  readOnlyClient,
};
