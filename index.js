import fs from "fs";
import fetch from "node-fetch";
import fetchCookie from "fetch-cookie";
import { HttpsProxyAgent } from "https-proxy-agent";
import { CookieJar } from "tough-cookie";
import figlet from "figlet";
import chalk from "chalk";

// === Konstanta dasar ===
const BASE_URL = "https://testnet.humanity.org";
const TOKENS = fs.readFileSync("token.txt", "utf-8")
  .split("\n")
  .map(t => t.trim())
  .filter(Boolean);
const PROXIES = fs.readFileSync("proxy.txt", "utf-8")
  .split("\n")
  .map(p => p.trim())
  .filter(Boolean);

// === Fungsi untuk mengambil proxy acak ===
function getRandomProxy() {
  if (PROXIES.length > 0) {
    const proxy = PROXIES[Math.floor(Math.random() * PROXIES.length)];
    return new HttpsProxyAgent(proxy);
  }
  return null;
}

// 🎨 Banner
function showBanner() {
  console.log(chalk.green(figlet.textSync("Humanity Auto Claim", { horizontalLayout: "default" })));
}

// === Fungsi utama untuk setiap akun ===
async function runAccount(token, index) {
  const jar = new CookieJar();
  const agent = getRandomProxy();
  const fetchWithCookies = fetchCookie(fetch, jar);

  const headers = {
    accept: "application/json, text/plain, */*",
    "content-type": "application/json",
    authorization: `Bearer ${token}`,
    token,
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
  };

  async function call(endpoint, method = "POST", body = {}) {
    const url = BASE_URL + endpoint;
    const res = await fetchWithCookies(url, {
      method,
      headers,
      agent,
      body: method === "GET" ? undefined : JSON.stringify(body)
    });

    const responseData = await res.json();
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return responseData;
  }

  try {
    while (true) {
      const userInfo = await call("/api/user/userInfo");
      console.log(`[#${index}] ✅ ${userInfo.data.nickName} | Wallet: ${userInfo.data.ethAddress}`);

      const balance = await call("/api/rewards/balance", "GET");
      console.log(`[#${index}] 💰 Total Reward: ${balance.balance.total_rewards}`);

      const rewardStatus = await call("/api/rewards/daily/check");
      if (!rewardStatus || !rewardStatus.available) {
        const nextClaimTime = new Date(rewardStatus?.next_daily_award || Date.now()).getTime();
        const now = Date.now();
        const waitMs = Math.max(nextClaimTime - now, 3600000); // Default 1 jam jika error
        const waitH = Math.floor(waitMs / 3600000);
        console.log(`[#${index}] ❌ ${rewardStatus?.message || 'Not Available'}. Wait ${waitH} hour.`);
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }

      const claim = await call("/api/rewards/daily/claim");
      console.log(`[#${index}] 🎉 Claim Success!`);

      const updatedBalance = await call("/api/rewards/balance", "GET");
      console.log(`[#${index}] 💰 Updated Reward: ${updatedBalance.balance.total_rewards}`);

      console.log(`[#${index}] ⏳ Try again for 1 minutes...`);
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
  } catch (err) {
    console.error(`[#${index}] ❌ Gagal: ${err.message}`);
    console.log(`[#${index}] 🔁 Try again for 1 minutes...`);
    await new Promise(resolve => setTimeout(resolve, 60000));
    runAccount(token, index); // Retry
  }
}

// === MAIN ===
showBanner();
TOKENS.forEach((token, idx) => {
  runAccount(token, idx + 1);
});
