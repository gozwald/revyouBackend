var express = require("express");
var router = express.Router();
const puppeteer = require("puppeteer");
const { predict } = require("../autoMLClient/client");

// https://www.amazon.com/{longname}/product-reviews/{asin}/ref=cm_cr_getr_d_paging_btm_prev_{pagenum}?pageNumber={pagenum}
//www.amazon.com/AINOPE-Rupture-Double-Compatible-Enclosures/product-review/B07YSNFNKD/ref=cm_cr_getr_d_paging_btm_prev_1?pageNumber=1

https: router.post("/getdata", function (req, res, next) {
  const { url } = req.body;

  reviewQuantifier(url);
  function reviewQuantifier(url) {
    const upperCaseRegex = /[A-Z1-9]{5,10}/;
    const hyphenatedWords = /((?:\w+-)+\w+)/;
    const splitUrl = url.split("%2F");
    if (!splitUrl[1] || !splitUrl[3])
      throw new Error("Missing information from the URL to parse it correctly");
    if (!hyphenatedWords.test(splitUrl[1]) && !upperCaseRegex.test(splitUrl[3]))
      throw new Error("The URL is malformed");
    const newUrl = `https://www.amazon.com/${splitUrl[1]}/product-review/${splitUrl[3]}/ref=cm_cr_getr_d_paging_btm_prev_1?pageNumber=1`;
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
        await page.goto(newUrl);
        await page.waitForSelector("body");

        const reviewPages = await page.evaluate(() => {
          let reviewBody = document.body.querySelector(
            "[data-hook='cr-filter-info-review-count']"
          ).innerText;

          return reviewBody;
        });
        await browser.close();
        let reviews = reviewPages.split(" ");
        const reviewCount = parseInt(reviews[3]);
        const urlCollection = [];
        for (let i = 1; i < reviewCount / 10; i++) {
          urlCollection.push(
            `https://www.amazon.com/${splitUrl[1]}/product-review/${splitUrl[3]}/ref=cm_cr_getr_d_paging_btm_prev_${i}?pageNumber=${i}`
          );
        }
        urlMapper(urlCollection);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  function urlMapper(url) {
    console.log(url);
    const finalResult = [];
    const finalTally = {
      count: {
        faulty_device: 0,
        worked_as_intended: 0,
        good_feature: 0,
      },
    };

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
                finalTally.count[review.label]++;
              });
              if (result.reviews.length === productInfo.length) {
                finalResult.push(result);
              }
              if (url.length === finalResult.length) {
                res.json({ finalResult, finalTally });
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
