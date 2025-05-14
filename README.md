
# Humanity Auto Claim Bot

A Node.js script to automatically claim daily rewards from the Humanity Protocol Testnet.

## ✨ Features

- Automatically logs in and claims daily rewards
- Support Multiple Account
- Checks user info and current balance
- Waits 24 hours after a successful claim before re-claiming
- Supports rotating proxies (HTTP/HTTPS)
- Handles cookies and authentication
- Robust error handling and retry mechanism
- Console banner on startup

## 🔧 Requirements

- Node.js 18+ (supports native ES Modules)
- A valid Humanity Testnet token
- List of working proxies (HTTP or HTTPS)

## 📦 Installation

1. Clone this repository:

```bash
git clone https://github.com/fadhielnaufan/humanity-auto-claim.git
cd humanity-auto-claim
```

2. Install dependencies:

```bash
npm install node-fetch fetch-cookie tough-cookie https-proxy-agent figlet chalk
```

3. Create required files:

* Create a file called token.txt and paste your Bearer token inside it:

```txt
your_token_here
```

* Create a file called proxy.txt and add one proxy per line:

```txt
http://username:password@proxy1.com:port
http://username:password@proxy2.com:port
```

## 🚀 Usage

To start the bot:

```bash
node index.js
```

The bot will:

* Display your nickname and wallet address
* Show your current reward balance
* Automatically claim when reward is available
* Wait 24 hours until next claim

If the reward is not yet available, it will wait until the next eligible time and try again.

## ⚠️ Warning

* Do not share your Bearer token or proxies publicly.
* Use at your own risk. The author is not responsible for any misuse or bans.

## 📁 File Structure

```
.
├── index.js           # Main bot script
├── token.txt          # Bearer token file
├── proxy.txt          # List of proxies
├── package.json       # NPM config
└── README.md          # Project documentation
```

## 🧠 License

This project is licensed under the MIT License.

```
Made with ❤️ by Fadhiel Naufan
```
