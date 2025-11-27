'use strict';
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

const apiRoutes = require('./routes/api.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');

const app = express();

/* ============================================================
   🔒 SECURITY HEADERS (CSP)
   FCC requires strict CSP in production, but MUST disable CSP
   during tests because the test runner uses origin=null.
=============================================================== */
const helmet = require('helmet');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"]
      }
    }
  })
);


/* ============================================================
   🌐 CORS
   FCC tests run inside an iframe with origin=null.
   This must allow null origin or requests will fail.
=============================================================== */
app.use(
  cors({
    origin: (origin, callback) => callback(null, true), // allow any origin including null
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS']
  })
);

/* ============================================================
   📦 BODY PARSING
=============================================================== */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* ============================================================
   📁 STATIC FILES
=============================================================== */
app.use('/public', express.static(process.cwd() + '/public'));

/* ============================================================
   🌍 MONGO CONNECTION
=============================================================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB Error:", err));

/* ============================================================
   🏠 INDEX PAGE
=============================================================== */
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

/* ============================================================
   🧪 FCC TESTING ROUTES
=============================================================== */
fccTestingRoutes(app);

/* ============================================================
   🧩 API ROUTES
=============================================================== */
apiRoutes(app);

/* ============================================================
   ❌ 404 HANDLER
=============================================================== */
app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

/* ============================================================
   🚀 START SERVER
=============================================================== */
let listener;

if (process.env.NODE_ENV === 'test') {
  // Run FCC functional tests automatically
  listener = app.listen(process.env.PORT || 3000, function () {
    console.log('Your app is listening on port ' + listener.address().port);
    console.log('Running Tests...');

    setTimeout(() => {
      try {
        runner.run();
      } catch (e) {
        console.log('Tests are not valid:');
        console.error(e);
      }
    }, 1500);
  });
} else {
  // Normal mode
  listener = app.listen(process.env.PORT || 3000, '0.0.0.0', function () {
    console.log('Your app is listening on http://localhost:' + listener.address().port);
  });
}

module.exports = app;
