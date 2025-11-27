"use strict";

const mongoose = require("mongoose");

const StockSchema = new mongoose.Schema({
  stock: {
    type: String,
    required: true,
    uppercase: true,
    unique: true
  },
  likes: {
    type: Number,
    default: 0
  },
  ips: {
    type: [String], // store anonymized IP hashes
    default: []
  }
});

module.exports = mongoose.model("Stock", StockSchema);
