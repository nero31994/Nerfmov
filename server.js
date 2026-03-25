import express from "express";
import puppeteer from "puppeteer";

const app = express();

app.get("/", (req, res) => {
  res.send("VixSrc Headless Scraper Running 🚀");
});

app.get("/extract", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.json({ streams: [] });
  }

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

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // 🔥 wait for scripts to load
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      const html = document.documentElement.innerHTML;

      const token = html.match(/token['"]:\s*['"](.*?)['"]/)?.[1];
      const expires = html.match(/expires['"]:\s*['"](.*?)['"]/)?.[1];

      const file =
        html.match(/file:\s*['"](.*?)['"]/)?.[1] ||
        html.match(/url:\s*['"](.*?)['"]/)?.[1] ||
        html.match(/source:\s*['"](.*?)['"]/)?.[1];

      return { token, expires, file };
    });

    if (!result.file) {
      return res.json({ streams: [] });
    }

    let streamUrl = result.file;

    if (result.token && result.expires) {
      streamUrl += `&token=${result.token}&expires=${result.expires}`;
    }

    return res.json({
      streams: [
        {
          name: "VixSrc Headless",
          title: "Auto Stream",
          url: streamUrl
        }
      ]
    });

  } catch (err) {
    console.error(err);
    return res.json({ streams: [] });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
