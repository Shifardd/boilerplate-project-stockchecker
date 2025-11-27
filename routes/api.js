"use strict";

const axios = require("axios");
const Stock = require("../models/Stock");

/* ============================================================
   📌 FCC REQUIRES:
   • GET /api/stock-prices?stock=GOOG
   • Optional like=true
   • Array when 2 stocks are passed
   • rel_likes for 2 stocks
=============================================================== */

module.exports = function (app) {
  app.route("/api/stock-prices").get(async function (req, res) {
    try {
      let { stock, like } = req.query;
      if (!stock) return res.json({ error: "stock symbol required" });

      const isArray = Array.isArray(stock);
      const stocks = isArray ? stock.map(s => s.toUpperCase()) : [stock.toUpperCase()];

      const clientIP = getHashedIP(req.ip);

      /* ==========================================
         📌 Get stock price from FCC proxy
      ========================================== */
      async function fetchPrice(symbol) {
        const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`;
        const r = await axios.get(url);
        return {
          symbol: r.data.symbol,
          price: r.data.latestPrice
        };
      }

      /* ==========================================
         📌 Handle like logic
      ========================================== */
      async function handleLikes(symbol) {
        let record = await Stock.findOne({ stock: symbol });
        if (!record) {
          record = new Stock({ stock: symbol, likes: 0, ips: [] });
        }

        if (like === "true" || like === true) {
          if (!record.ips.includes(clientIP)) {
            record.likes++;
            record.ips.push(clientIP);
          }
        }

        await record.save();
        return record.likes;
      }

      /* ==========================================
         📌 SINGLE STOCK
      ========================================== */
      if (!isArray) {
        const data = await fetchPrice(stocks[0]);
        const likes = await handleLikes(data.symbol);

        return res.json({
          stockData: {
            stock: data.symbol,
            price: data.price,
            likes: likes
          }
        });
      }

      /* ==========================================
         📌 DOUBLE STOCK (2 stocks only)
      ========================================== */
      const dataA = await fetchPrice(stocks[0]);
      const dataB = await fetchPrice(stocks[1]);

      const likesA = await handleLikes(dataA.symbol);
      const likesB = await handleLikes(dataB.symbol);

      return res.json({
        stockData: [
          {
            stock: dataA.symbol,
            price: dataA.price,
            rel_likes: likesA - likesB
          },
          {
            stock: dataB.symbol,
            price: dataB.price,
            rel_likes: likesB - likesA
          }
        ]
      });

    } catch (err) {
      console.error(err);
      return res.json({ error: "external source error" });
    }
  });
};

/* ============================================================
   🔐 IP HASHING LOGIC (FCC Requires Unique IP Per Like)
=============================================================== */
const testIPMap = {};

function getHashedIP(ip) {
  if (process.env.NODE_ENV === "test") {
    // FCC uses different iframes -> must stabilize IP
    if (!testIPMap[ip]) {
      testIPMap[ip] = Math.random().toString(36).slice(2);
    }
    return testIPMap[ip];
  }

  // Real IP → mask last octet for privacy
  return ip.replace(/\d+$/, "0");
}
