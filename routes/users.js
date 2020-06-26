var express = require("express");
var router = express.Router();

const { predict } = require("../autoMLClient/client");

router.post("/test", function (req, res, next) {
  const result = [];
  const { reviews } = req.body;

  reviews.map((item, index, array) => {
    predict(item).then((item) => {
      result.push(item);
      if (result.length === reviews.length) {
        return res.send(result);
      }
      if (array.length === index) {
        throw new Error("Blergh");
      }
    });
  });
});

module.exports = router;
