import express from "express";
import puppeteer from "puppeteer";

const app = express();

// ✅ Health check
app.get("/", (req, res) => {
  res.send("VixSrc Headless Scraper PRO Running 🚀");
});

// ✅ Extract route
app.get("/extract", async (req, res) => {
  const { url } = req.query;

  if (!url) return res.json({ streams: [] });

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    );

    let streamUrl = null;

    // 🔥 INTERCEPT REQUESTS
    page.on("request", (req) => {
      const reqUrl = req.url();
      if (reqUrl.includes(".m3u8")) {
        streamUrl = reqUrl;
      }
    });

    // 🔥 INTERCEPT RESPONSES (STRONGER)
    page.on("response", (res) => {
      const resUrl = res.url();
      if (resUrl.includes(".m3u8")) {
        streamUrl = resUrl;
      }
    });

    // 🚀 OPEN PAGE
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // ⏳ WAIT INITIAL LOAD
    await page.waitForTimeout(4000);

    // 🔥 HANDLE IFRAME (VERY IMPORTANT)
    const frames = page.frames();
    for (const frame of frames) {
      try {
        const frameUrl = frame.url();
        if (frameUrl.includes("http")) {
          // try to trigger activity inside iframe
          await frame.evaluate(() => {
            const video = document.querySelector("video");
            if (video) {
              video.muted = true;
              video.play().catch(() => {});
            }
          });
        }
      } catch (e) {}
    }

    // 🔥 AUTO INTERACTION (simulate user)
    await page.mouse.click(300, 300);

    await page.evaluate(() => {
      const video = document.querySelector("video");
      if (video) {
        video.muted = true;
        video.play().catch(() => {});
      }
    });

    // ⏳ WAIT FOR STREAM REQUESTS
    await page.waitForTimeout(8000);

    await browser.close();

    if (!streamUrl) {
      return res.json({ streams: [] });
    }

    return res.json({
      streams: [
        {
          name: "VixSrc Headless PRO",
          title: "Auto Detected Stream",
          url: streamUrl
        }
      ]
    });

  } catch (err) {
    console.error("Scraper error:", err);

    if (browser) await browser.close();

    return res.json({ streams: [] });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
