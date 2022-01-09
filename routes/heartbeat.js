const express = require("express");
const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).send('I`m ok!').end();
});

/**
 * 模拟第三方接收数据的服务
 */
router.post("/uploadtests", (req, res) => {
  // console.log(`req.body: ${JSON.stringify(req.body)}`)
  res.status(200).end();
});

module.exports = router;
