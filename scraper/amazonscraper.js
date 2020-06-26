const puppeteer = require("puppeteer");

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
    await page.goto(
      "https://www.amazon.com/Echo-Dot/product-reviews/B07FZ8S74R/ref=cm_cr_arp_d_paging_btm_next_2?ie=UTF8&reviewerType=all_reviews&pageNumber=1"
    );
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

      return data;
    });

    console.log(productInfo);
    await browser.close();
  })
  .catch(function (error) {
    console.error(error);
  });
