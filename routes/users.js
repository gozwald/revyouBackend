var express = require("express");
var router = express.Router();

const { predict } = require("../autoMLClient/client");

router.post("/test", function (req, res, next) {
  const { reviews } = req.body;

  const result = {
    amazonUrl: "www.blah.com",
    reviews: [],
    count: {
      faulty_device: 0,
      worked_as_intended: 0,
      good_feature: 0,
    },
  };
  const promises = reviews.map((item, index, array) => {
    predict(item).then((sentiment) => {
      console.log(sentiment);
      result.reviews.push(...sentiment);
      // if (result.reviews.length === reviews.length) {
      //   result.reviews.forEach((review) => {
      //     if (review) result.count[review.label]++;
      //   });
      //   return res.json(result);
      // }
      // if (array.length === index) {
      //   throw new Error("Blergh");
      // }
    });
  });
  Promise.all(promises).then((data) => res.json(result));
});

module.exports = router;
