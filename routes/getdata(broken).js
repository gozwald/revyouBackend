var express = require("express");
var router = express.Router();
const puppeteer = require("puppeteer");
const { predict } = require("../autoMLClient/client");
require("events").EventEmitter.defaultMaxListeners = 0;

router.post("/getdata", function (req, res, next) {
  const { url } = req.body;

  const decodedUrl = decodeURIComponent(url);
  const upperCaseRegex = /[A-Z1-9]{5,10}/;
  const hyphenatedWords = /((?:\w+-)+\w+)/;
  const splitUrl = decodedUrl.split("/");
  const asin = splitUrl.splice(-2, 1);
  const slug = splitUrl.splice(-3, 1);

  const finalResult = [];
  const finalTally = {
    count: {
      faulty_device: 0,
      worked_as_intended: 0,
      good_feature: 0,
    },
  };
  const snippetCollection = {
    snippetCollection: {
      faulty_device: [],
      worked_as_intended: [],
      good_feature: [],
    },
  };

  if (!asin[0] || !slug[0])
    throw new Error("Missing information from the URL to parse it correctly");
  if (!hyphenatedWords.test(slug[0]) && !upperCaseRegex.test(asin[0]))
    throw new Error("The URL is malformed");
  const newUrl = `https://www.amazon.com/${slug[0]}/product-review/${asin[0]}/ref=cm_cr_getr_d_paging_btm_prev_1?pageNumber=1`;

  puppeteer
    .launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--window-size=1920,1080",
        '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"',
      ],
    })
    .then(async (browser) => {
      const page = await browser.newPage();
      await page.goto(newUrl);
      await page.waitForSelector("body");

      const reviewPages = await page
        .evaluate(() => {
          console.log(slug);
          let reviewBody = document.body.querySelector(
            "[data-hook='cr-filter-info-review-count']"
          ).innerText;

          let reviews = reviewBody.split(" ");
          const reviewCount = parseFloat(reviews[3].replace(/,/g, ""));
          const urlCollection = [];
          for (let i = 1; i < reviewCount / 10 && i < 6; i++) {
            urlCollection.push(
              `https://www.amazon.com/${slug[0]}/product-review/${asin[0]}/ref=cm_cr_getr_d_paging_btm_prev_${i}?pageNumber=${i}`
            );
          }
          console.log(urlCollection);

          return urlCollection;
        })
        .then(async (browser) => {
          reviewPages.forEach(async (e, index) => {
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
                  snippetCollection.snippetCollection[review.label].push(
                    review.snippet
                  );
                });
                if (result.reviews.length === productInfo.length) {
                  finalResult.push(result);
                }
                if (url.length === finalResult.length) {
                  res.json({ finalResult, finalTally, snippetCollection });
                }

                if (array.length === index) {
                  throw new Error("Blergh");
                }
              });
            });

            await browser.close();
            if (index === url.length) {
              console.log(finalResult);
            }
          });
        })
        .catch(function (error) {
          console.error(error);
        });
    });
});

module.exports = router;
