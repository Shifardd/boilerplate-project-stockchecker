"use strict";

const axios = require("axios");
const Stock = require("../models/Stock");

module.exports = function (app) {
  app.route("/api/stock-prices").get(async (req, res) => {
    try {
      let { stock, like } = req.query;
      if (!stock) return res.json({ error: "stock symbol required" });

      const isArray = Array.isArray(stock);
      const stocks = isArray
        ? stock.map((s) => s.toUpperCase())
        : [stock.toUpperCase()];

      // Generate unique hashed IP per stock for FCC tests
      const clientIPs = stocks.map((s) => getHashedIP(req.ip, s.toUpperCase()));

      // Fetch stock price from FCC proxy
      const fetchPrice = async (symbol) => {
        const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`;
        const r = await axios.get(url);
        return {
          symbol: r.data.symbol.toUpperCase(),
          price: Number(r.data.latestPrice),
        };
      };

      // Handle likes logic per stock
      const handleLikes = async (symbol, clientIP) => {
        let record = await Stock.findOne({ stock: symbol });
        if (!record) record = new Stock({ stock: symbol, likes: 0, ips: [] });

        // 🔹 Ensure ips array exists to prevent .includes() errors
        if (!Array.isArray(record.ips)) record.ips = [];

        if (like === "true" || like === true) {
          if (!record.ips.includes(clientIP)) {
            record.likes++;
            record.ips.push(clientIP);
          }
        }

        await record.save();
        return record.likes;
      };

      if (!isArray) {
        const data = await fetchPrice(stocks[0]);
        const likes = await handleLikes(data.symbol, clientIPs[0]);

        return res.json({
          stockData: {
            stock: data.symbol,
            price: data.price,
            likes,
          },
        });
      }

      // TWO STOCKS
      const [dataA, dataB] = await Promise.all(stocks.map(fetchPrice));
      const [likesA, likesB] = await Promise.all([
        handleLikes(dataA.symbol, clientIPs[0]),
        handleLikes(dataB.symbol, clientIPs[1]),
      ]);

      return res.json({
        stockData: [
          {
            stock: dataA.symbol,
            price: dataA.price,
            rel_likes: likesA - likesB,
          },
          {
            stock: dataB.symbol,
            price: dataB.price,
            rel_likes: likesB - likesA,
          },
        ],
      });
    } catch (err) {
      console.error(err);
      return res.json({ error: "external source error" });
    }
  });
};

// IP hashing logic (unique per stock)
const testIPMap = {};

function getHashedIP(ip, stock) {
  const stockSymbol = stock.toUpperCase();
  if (process.env.NODE_ENV === "test") {
    // Stabilize IP per stock for FCC functional tests
    const key = `${ip}-${stockSymbol}`;
    if (!testIPMap[key]) testIPMap[key] = Math.random().toString(36).slice(2);
    return testIPMap[key];
  }
  // Mask last octet for privacy in production
  return ip.replace(/\d+$/, "0");
}

