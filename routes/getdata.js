var express = require("express");
var router = express.Router();
const puppeteer = require("puppeteer");
const { predict } = require("../autoMLClient/client");

// https://www.amazon.com/{longname}/product-reviews/{asin}/ref=cm_cr_arp_d_paging_btm_next_{pagenum}?ie=UTF8&reviewerType=all_reviews&pageNumber={pagenum}

router.post("/getdata", function (req, res, next) {
  const { url } = req.body;

  urlMapper(url);

  function urlMapper(url) {
    const finalResult = [];
    url.forEach((e, index) => {
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
          await page.goto(e);
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
          const result = {
            amazonUrl: e,
            reviews: [],
            count: {
              faulty_device: 0,
              worked_as_intended: 0,
              good_feature: 0,
            },
          };
          productInfo.map((item, index, array) => {
            predict(item).then((sentiment) => {
              result.reviews.push({ review: item, sentiment });
              sentiment.forEach((review) => {
                result.count[review.label]++;
              });
              if (result.reviews.length === productInfo.length) {
                finalResult.push(result);
              }
              if (url.length === finalResult.length) {
                res.json(finalResult);
              }

              if (array.length === index) {
                throw new Error("Blergh");
              }
            });
          });

          await browser.close();
        })
        .catch(function (error) {
          console.error(error);
        });

      if (index === url.length) {
        console.log(finalResult);
      }
    });
  }
});

module.exports = router;
