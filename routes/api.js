"use strict";

const axios = require("axios");
const Stock = require("../models/Stock");

module.exports = function (app) {
  app.route("/api/stock-prices").get(async (req, res) => {
    try {
      let { stock, like } = req.query;
      if (!stock) return res.json({ error: "stock symbol required" });

      const isArray = Array.isArray(stock);
      const stocks = isArray ? stock.map(s => s.toUpperCase()) : [stock.toUpperCase()];
      const clientIP = getHashedIP(req.ip);

      // Fetch stock price
      const fetchPrice = async (symbol) => {
        const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`;
        const r = await axios.get(url);
        return {
          symbol: r.data.symbol.toUpperCase(),
          price: Number(r.data.latestPrice)
        };
      };

      // Handle likes logic
      const handleLikes = async (symbol) => {
        let record = await Stock.findOne({ stock: symbol });
        if (!record) record = new Stock({ stock: symbol, likes: 0, ips: [] });

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
        const likes = await handleLikes(data.symbol);

        return res.json({
          stockData: {
            stock: data.symbol,
            price: data.price,
            likes
          }
        });
      }

      // Two stocks
      const [dataA, dataB] = await Promise.all(stocks.map(fetchPrice));
      const [likesA, likesB] = await Promise.all([handleLikes(dataA.symbol), handleLikes(dataB.symbol)]);

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

// IP hashing logic
const testIPMap = {};

function getHashedIP(ip) {
  if (process.env.NODE_ENV === "test") {
    // Always return same hash for same IP
    if (!testIPMap[ip]) testIPMap[ip] = Math.random().toString(36).slice(2);
    return testIPMap[ip];
  }
  return ip.replace(/\d+$/, "0");
}
