'use strict';
const express = require('express');
const app = express();
const wave = require('./index');

// Run it and open http://localhost:3000/...

app.get('*', function (req, res) {
  wave.handler(req).then(function(result) {
    res.set(result.headers);
    res.send(result.body);
  });
});

app.listen(3000);
