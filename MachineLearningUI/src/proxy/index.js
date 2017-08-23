var express = require('express');  
var request = require('request');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use('/rest', function(req, res) {  
  var url = 'http://localhost:11015' + req.url;

  var opts = {
  	  method: req.method,
      url: url,
      body: JSON.stringify(req.body),
  };

  request(opts, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      res.json(body);
    } else {
      console.error('Could not POST to', error || response.statusCode);
      if (error && error.code === 'ECONNREFUSED') {
        res.send(500, 'Unable to connect to the CDAP Gateway. Please check your configuration.');
      } else {
        res.send(500, error || response.statusCode);
      }
    }
  });
});

app.listen(8111);  