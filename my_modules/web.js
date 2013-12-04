var express = require('../node_modules/express'),
  exphbs  = require('express3-handlebars'),
  passport = require('../node_modules/passport'),
  util = require('util'),
  TwitterStrategy = require('../node_modules/passport-twitter').Strategy
  config = require('./config.js');

module.exports = function Web() {
  var app = express();

  app.engine('handlebars', exphbs({defaultLayout: 'main'}));
  app.set('view engine', 'handlebars');

  app.get('/', function (req, res) {
      res.render('home');
  });

  app.listen(3000);

  console.log('Created web server');
};