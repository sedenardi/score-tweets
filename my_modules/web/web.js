var events = require('events'),
  express = require('express'),
  //exphbs  = require('express3-handlebars'),
  hbars = require('./hbars.js'),
  passport = require('passport'),
  util = require('util'),
  TwitterStrategy = require('passport-twitter').Strategy,
  db = require('../db/db.js');

var Web = function(config, rootDir, leagues) {
  var self = this;
  var leagueStatuses = {};
  var twitStatuses = {};
  
  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(obj, done) {
    done(null, obj);
  });

  if (config.twitter.app.consumerKey &&
    config.twitter.app.consumerSecret &&
    config.twitter.app.callbackURL) {
    passport.use(new TwitterStrategy({
        consumerKey: config.twitter.app.consumerKey,
        consumerSecret: config.twitter.app.consumerSecret,
        callbackURL: config.twitter.app.callbackURL
      },
      function processAuth(token, tokenSecret, profile, done) {
        var user = {
          token: token,
          tokenSecret: tokenSecret,
          profile: profile
        };
        return done(null, user);
      }
    ));
  }

  var app = express(),
    hbs = new hbars(rootDir, config);

  app.engine('handlebars', hbs.hbs.engine);

  app.configure(function() {
    app.set('views', rootDir + '/web/views');
    app.set('view engine', 'handlebars');
    //app.use(express.logger());
    app.use(express.cookieParser());
    app.use(express.json());
    app.use(express.urlencoded())
    app.use(express.methodOverride());
    app.use(express.session({ secret: 'gmengmen' }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(express.static(rootDir + config.web.folders.static));
  });
  
  app.get('/', function (req, res) {
    res.render('index', {
      leagues: leagues,
      leagueStatuses: leagueStatuses
    });
  });

  /*app.get('/account', ensureAuthenticated, function(req, res){
    res.render('account', { user: req.user });
  });*/

  app.get('/GetLatestGames', function (req, res) {
      if (typeof req.query.league !== 'undefined') {
        var leagueName = req.query.league.toUpperCase();
        if (typeof leagues[leagueName] !== 'undefined') {
          if (typeof req.query.hoursAgo === 'undefined' ||
            !isNaN(parseInt(req.query.hoursAgo))) {
            var hoursAgo = !isNaN(parseInt(req.query.hoursAgo)) ? 
              parseInt(req.query.hoursAgo) : 12;
            var cmd = leagues[leagueName].latestGamesQuery(hoursAgo);
            db.queryWithError(cmd, function webDBReturn(err,data) {
              if (err) {
                console.log('web DB error');
                res.json(500,err);
              } else {
                res.render('gameList', {
                  layout: false,
                  games: data
                });
              }
            });
          } else {
            res.json(402, { error: 'hoursAgo parameter must be a number.'});
          }          
        } else {
          res.json(402, { error: 'Specified league does not exist.'});
        }
      } else {
        res.json(402, { error: 'Must specify league parameter.'});
      }
  });

  app.get('/GetScheduledGames', function (req, res) {
      if (typeof req.query.league !== 'undefined') {
        var leagueName = req.query.league.toUpperCase();
        if (typeof leagues[leagueName] !== 'undefined') {
          var cmd = leagues[leagueName].scheduledGamesQuery(req.query.hoursAgo);
          db.queryWithError(cmd, function webDBReturn(err,data) {
            if (err) {
              console.log('web DB error');
              res.json(500,err);
            } else {
              //res.json(200,data);
              res.render('gameList', {
                layout: false,
                games: data
              });
            }
          });         
        } else {
          res.json(402, { error: 'Specified league does not exist.'});
        }
      } else {
        res.json(402, { error: 'Must specify league parameter.'});
      }
  });

  app.get('/GetLeagueStatus', function (req, res) {
      if (typeof req.query.league !== 'undefined') {
        var leagueName = req.query.league.toUpperCase();
        if (typeof leagues[leagueName] !== 'undefined') {
          res.json(leagueStatuses[leagueName]);
        } else {
          res.json(402, { error: 'Specified league does not exist.'});
        }
      } else {
        res.json(402, { error: 'Must specify league parameter.'});
      }
  });

  app.get('/GetTwitterStatus', function (req, res) {
      if (typeof req.query.league !== 'undefined') {
        var leagueName = req.query.league.toUpperCase();
        if (typeof leagues[leagueName] !== 'undefined') {
          res.json(twitStatuses[leagueName]);
        } else {
          res.json(402, { error: 'Specified league does not exist.'});
        }
      } else {
        res.json(402, { error: 'Must specify league parameter.'});
      }
  });

  app.get('/login', function(req, res){
    res.render('login', { 
      user: req.user,
      result: req.session.result
    });
  });

  app.get('/auth/twitter',
    passport.authenticate('twitter'),
    function(req, res){
      // not called
  });

  app.get('/auth/twitter/callback', 
    passport.authenticate('twitter', { failureRedirect: '/login' }),
    function(req, res) {
      var user = req.user.profile.username;
      if (config.twitter.accounts[user] !== 'undefined'){
        if (config.twitter.accounts[user].access_token_key ||
          config.twitter.accounts[user].access_token_secret) {
          req.session.result = 'Keys exist for user. Clear keys in config and try again';
        } else {
          self.emit('auth', req.user);
          req.session.result = 'Successfully Authenticated';
        }
      } else {
        req.session.result = 'User not found in config';
      }   
      res.redirect('/login');
  });

  app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/login');
  });  

  this.startServer = function() {
    db.connect(config, 'WEB', function webDB() {
      app.listen(config.web.port, function webStarted() {
        console.log('Created web server');
      });
    });
  };

  this.updateLeagueStatus = function(status){
    leagueStatuses[status.league] = status;
  };

  this.updateTwitStatus = function(status){
    twitStatuses[status.league] = status;
  };
  
};

util.inherits(Web, events.EventEmitter);

module.exports = Web;