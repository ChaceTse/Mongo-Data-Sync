const env = process.env.NODE_ENV || "dev";

const configPath = `../configs/${env}`;
const baseConfig = require("../configs/base");
let envConfigs = require(configPath);

const Config = Object.assign(
  {
    env,
    isProduction: ["prod", "production"].indexOf(env) > -1,
    isDevelopment: ["dev", "development"].indexOf(env) > -1,
  },
  baseConfig,
  envConfigs
);

module.exports = Config;
