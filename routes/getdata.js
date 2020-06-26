var express = require("express");
var router = express.Router();
const puppeteer = require("puppeteer");
const { predict } = require("../autoMLClient/client");

router.post("/getdata", function (req, res, next) {
  const result = [];
  const { url } = req.body;

  puppeteer
    .launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--window-size=1920,1080",
        '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"',
      ],
    })
    .then(async (browser) => {
      const page = await browser.newPage();
      await page.goto(url);
      await page.waitForSelector("body");

      var productInfo = await page.evaluate(() => {
        let data = [];
        //   let datatitle = [];
        let reviewbody = document.body.querySelectorAll(
          "[data-hook='review-body']"
        );
        for (let element of reviewbody) {
          data.push(element.textContent.trim());
        }
        //   let reviewtitle = document.body.querySelectorAll(
        //     "[data-hook='review-title']"
        //   );
        //   for (let element of reviewtitle) {
        //     datatitle.push(element.textContent.trim());
        //   }

        // const finalData = {
        //   reviews: [data],
        // };

        return data;
      });

      productInfo.map((item, index, array) => {
        predict(item).then((item) => {
          result.push(item);
          if (result.length === productInfo.length) {
            return res.send(result);
          }
          if (array.length === index) {
            throw new Error("Blergh");
          }
        });
      });

      console.log(productInfo);
      await browser.close();
    })
    .catch(function (error) {
      console.error(error);
    });
});

module.exports = router;
