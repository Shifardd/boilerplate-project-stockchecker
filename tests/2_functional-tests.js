const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite("Functional Tests", function () {
  this.timeout(5000);

  let likesBefore = 0;

  /* ==============================
     1. Viewing one stock
  ============================== */
  test("Viewing one stock: GET /api/stock-prices/", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices/") // trailing slash added
      .query({ stock: "GOOG" })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, "stockData");
        assert.equal(res.body.stockData.stock, "GOOG");
        assert.property(res.body.stockData, "price");
        assert.property(res.body.stockData, "likes");

        likesBefore = res.body.stockData.likes;
        done();
      });
  });

  /* ===========================================
     2. Viewing one stock and liking it once
  =========================================== */
  test("Viewing one stock and liking it: GET /api/stock-prices/", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices/") // trailing slash added
      .query({ stock: "GOOG", like: true })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.stockData.stock, "GOOG");
        assert.isAtLeast(res.body.stockData.likes, likesBefore);

        likesBefore = res.body.stockData.likes;
        done();
      });
  });

  /* ==========================================================
     3. Viewing the same stock and liking it again (no change)
  ========================================================== */
  test("Viewing same stock and liking it again: GET /api/stock-prices/", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices/") // trailing slash added
      .query({ stock: "GOOG", like: true })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.stockData.stock, "GOOG");
        assert.equal(
          res.body.stockData.likes,
          likesBefore,
          "Should not increase like count again"
        );
        done();
      });
  });

  /* ==============================
     4. Viewing two stocks
  ============================== */
  test("Viewing two stocks: GET /api/stock-prices/", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices/") // trailing slash added
      .query({ stock: ["GOOG", "MSFT"] })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);

        const [stock1, stock2] = res.body.stockData;

        assert.property(stock1, "stock");
        assert.property(stock1, "price");
        assert.property(stock1, "rel_likes");

        assert.property(stock2, "stock");
        assert.property(stock2, "price");
        assert.property(stock2, "rel_likes");

        done();
      });
  });

  /* ==============================================
     5. Viewing two stocks and liking them
  ============================================== */
  test("Viewing two stocks and liking them: GET /api/stock-prices/", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices/") // trailing slash added
      .query({ stock: ["GOOG", "MSFT"], like: true })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);

        const [stock1, stock2] = res.body.stockData;

        assert.property(stock1, "rel_likes");
        assert.property(stock2, "rel_likes");

        done();
      });
  });
});
