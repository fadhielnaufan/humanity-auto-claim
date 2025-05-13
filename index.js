import fs from "fs";
import fetch from "node-fetch";
import fetchCookie from "fetch-cookie";
import { HttpsProxyAgent } from "https-proxy-agent";
import { CookieJar } from "tough-cookie";
import figlet from "figlet";
import chalk from "chalk";

const BASE_URL = "https://testnet.humanity.org";
const TOKEN = fs.readFileSync("token.txt", "utf-8").trim();
const PROXIES = fs.readFileSync("proxy.txt", "utf-8").split("\n").map(p => p.trim()).filter(Boolean);

function getRandomProxy() {
  // Jika proxy.txt tidak kosong, ambil proxy secara acak
  if (PROXIES.length > 0) {
    const proxy = PROXIES[Math.floor(Math.random() * PROXIES.length)];
    return new HttpsProxyAgent(proxy);
  }
  // Jika proxy.txt kosong, kembalikan null (tanpa proxy)
  return null;
}

const jar = new CookieJar();
const agent = getRandomProxy(); // Agent menggunakan proxy jika ada, atau null jika tidak ada
const fetchWithCookies = fetchCookie(fetch, jar);

const headers = {
  "accept": "application/json, text/plain, */*",
  "content-type": "application/json",
  "authorization": `Bearer ${TOKEN}`,
  "token": TOKEN,
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
};

// 🎨 Tampilkan banner saat program dijalankan
function showBanner() {
  console.log(chalk.green(figlet.textSync("Humanity Auto Claim", { horizontalLayout: "default" })));
}

async function call(endpoint, method = "POST", body = {}) {
  const url = BASE_URL + endpoint;
  const res = await fetchWithCookies(url, {
    method,
    headers,
    agent, // Gunakan agent jika ada, atau null jika tidak ada
    body: method === "GET" ? undefined : JSON.stringify(body)
  });

  const responseData = await res.json();
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return responseData;
}

async function run() {
  // Tampilkan banner hanya sekali di awal
  showBanner();

  try {
    while (true) {
      const userInfo = await call("/api/user/userInfo");
      console.log("✅ User Info:", userInfo.data.nickName);
      console.log("✅ Wallet:", userInfo.data.ethAddress);

      const balance = await call("/api/rewards/balance", "GET");
      console.log("💰 Total Reward:", balance.balance.total_rewards);

      const rewardStatus = await call("/api/rewards/daily/check");
      console.log("📊 Reward Status:", rewardStatus);

      if (!rewardStatus) {
        console.log("❌ Invalid reward status data");
        return;
      }

      if (!rewardStatus.available) {
        const nextClaimTime = new Date(rewardStatus.next_daily_award).getTime();
        const now = Date.now();
        const waitHours = Math.floor((nextClaimTime - now) / 3600000);
        console.log(`❌ ${rewardStatus.message}. Try again in ${waitHours} hours.`);

        const waitTime = nextClaimTime - now;
        console.log(`⏳ Waiting ${waitHours} hours for next claim...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      const claim = await call("/api/rewards/daily/claim");
      console.log("🎉 Claim berhasil");

      const updatedUserInfo = await call("/api/user/userInfo");
      console.log("✅ User Info:", updatedUserInfo.data.nickName);
      console.log("✅ Wallet:", updatedUserInfo.data.ethAddress);

      const updatedBalance = await call("/api/rewards/balance", "GET");
      console.log("💰 Total Reward:", updatedBalance.balance.total_rewards);

      console.log("⏳ Waiting 1 minute for next check...");
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
  } catch (err) {
    console.error("❌ Gagal:", err.message);
    console.log("⏳ Waiting 1 minute before retrying...");
    await new Promise(resolve => setTimeout(resolve, 60000));
    run(); // Retry
  }
}

run();
