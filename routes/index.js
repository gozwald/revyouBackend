var express = require("express");
var router = express.Router();
const { predict } = require("../autoMLClient/client");

const arr = ["worked perfectly", "horrible cable"];
const newArr = [];

/* GET home page. */
router.get("/", function (req, res, next) {
  res.send("hello");
  arr.map((item) => {
    predict(item)
      .then((item) => {
        newArr.push(item);
      })
      .then((res) => console.log(newArr));
  });
});

module.exports = router;
