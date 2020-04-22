const puppeteer = require("puppeteer-extra");

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const CronJob = require("cron").CronJob;

const LOGIN = {
  userName: "",
  password: "",
};

// const step = "*/5 * * * *"; // every 5 mins ...
const step = "*/5 * * * *"; // every 5 mins ...

const URL = {
  login: "https://member.lazada.sg/user/login",
};

const waitUntil = {
  timeout: 60 * 1000,
  waitUntil: ["load", "domcontentloaded", "networkidle0", "networkidle2"],
};

const loadPage = async (url, page) => {
  try {
    await page.goto(url, waitUntil);
  } catch (error) {
    throw new Error(`${url} not loaded ${error}`);
  }
};

const cb = async (job) => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();

  await loadPage(URL.login, page);
  await page.type(".mod-input-loginName input", LOGIN.userName);
  await page.type(".mod-input-password input", LOGIN.password);

  await page.click(".next-btn");
  await page.waitForNavigation(waitUntil);

  // Go to cart page after login...
  await page.click(".lzd-nav-cart");
  await page.waitForSelector(".checkout-shop");

  await page.evaluate(() => {
    [...document.querySelectorAll(".checkout-shop")]
      .find((element) => element.innerHTML.includes("RedMart"))
      .querySelector(".checkout-shop-checkbox input")
      .click();
  });

  await page.waitFor(3000);
  await page.click(".checkout-order-total-button");
  await page.waitForNavigation(waitUntil);

  await page.click(".got-it-btn");
  await page.click(".deliveryTimeRight button");
  await page.screenshot({ path: "lazada.png" });

  await page.evaluate(() => {
    if (
      [...document.querySelectorAll(".slot-item-container")].find(
        (item) => !item.classList.contains("disabled")
      ).length === 1
    ) {
      console.log("SLOT FOUND!!!!");
      job.stop();
    }
  });

  await browser.close();
};

const job = new CronJob(step, () => cb(job));
job.start();
