import express from "express";
import puppeteer from "puppeteer";

const app = express();

// ✅ Health check
app.get("/", (req, res) => {
  res.send("VixSrc Headless Scraper PRO+ Running 🚀");
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

    // 💣 STRONG: INTERCEPT RESPONSES (MAIN LOGIC)
    page.on("response", async (response) => {
      try {
        const resUrl = response.url();

        // Direct .m3u8
        if (resUrl.includes(".m3u8")) {
          streamUrl = resUrl;
          return;
        }

        // 🔥 Detect API responses that contain stream
        if (
          resUrl.includes("playlist") ||
          resUrl.includes("source") ||
          resUrl.includes("embed") ||
          resUrl.includes("api")
        ) {
          const text = await response.text();

          const match = text.match(/https?:\/\/[^"' ]+\.m3u8[^"' ]*/);

          if (match) {
            streamUrl = match[0];
          }
        }

      } catch (e) {}
    });

    // 🚀 OPEN PAGE
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // ⏳ INITIAL WAIT
    await page.waitForTimeout(4000);

    // 🔥 HANDLE IFRAMES
    const frames = page.frames();
    for (const frame of frames) {
      try {
        await frame.evaluate(() => {
          const video = document.querySelector("video");
          if (video) {
            video.muted = true;
            video.play().catch(() => {});
          }
        });
      } catch (e) {}
    }

    // 🔥 USER INTERACTION
    await page.mouse.click(300, 300);

    await page.evaluate(() => {
      const video = document.querySelector("video");
      if (video) {
        video.muted = true;
        video.play().catch(() => {});
      }
    });

    // ⏳ WAIT FOR NETWORK ACTIVITY
    await page.waitForTimeout(10000);

    await browser.close();

    if (!streamUrl) {
      return res.json({ streams: [] });
    }

    return res.json({
      streams: [
        {
          name: "VixSrc PRO+",
          title: "XHR Detected Stream",
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
