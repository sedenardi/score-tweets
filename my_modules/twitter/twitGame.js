var twitter = require('ntwitter'),
  db = require('../db/db.js'),
  events = require('events'),
  util = require('util');

var TwitGame = function(config, l) {

  var self = this;
  var league = l;
  var accountName;
  var twit;
  var ready = false;
  var looping = false;
  var loopTimeout = null;
  var throttled = false;

  for (var i = 0; i < config.twitter.accounts.length; i++) {
    if (config.twitter.accounts[i].league === league.leagueInfo.leagueName) {
      if (config.twitter.app.consumerKey &&
        config.twitter.app.consumerSecret &&
        config.twitter.accounts[i].access_token_key &&
        config.twitter.accounts[i].access_token_secret) {
        twit = new twitter({
          consumer_key: config.twitter.app.consumerKey,
          consumer_secret: config.twitter.app.consumerSecret,
          access_token_key: config.twitter.accounts[i].access_token_key,
          access_token_secret: config.twitter.accounts[i].access_token_secret
        });
      }
    }
  }

  var undoThrottle = function() {
    console.log(league.leagueInfo.leagueName + '-TwitGame: Undoing throttle');
    throttled = false;
    looping = true;
    checkForTweet();
  };

  var sendTweet = function(tweet, next) {
    twit.updateStatus(tweet.TweetString, function twitterResponse(err,data) {
      if (err){
        console.log(league.leagueInfo.leagueName + '-TwitGame: ERROR - ' + JSON.stringify(err));
        looping = false;
        if (typeof err.statusCode !== 'undefined' && err.statusCode === 403) {
          console.log(league.leagueInfo.leagueName + '-TwitGame: throttling');
          throttled = true;
          setTimeout(undoThrottle,240000);
          /*var e = {
            source: 'TwitGame',
            message: 'ERROR',
            stack: 'Throttling'
          };
          db.logError(e, function(){});*/
        }
      } else {
        updateTweet(tweet.TweetID, data.id_str, next);
      }
    });
    //updateTweet(tweet.TweetID, 'test', next);
  };

  var updateTweet = function(TweetID, TwitterID, next) {
    var cmd = league.updateTweetQuery(TweetID, TwitterID);
    db.queryWithError(cmd,next);
  };

  var checkForTweet = function() {
    var cmd = league.nextTweetQuery();
    db.query(cmd, function dbResponse(res) {
      if (res.length) {
        sendTweet(res[0], function postTweet(err, res) {
          if (err) {
            err.source = 'TwitGame';
            db.logError(err, function(){});
            looping = false;
          } else {
            setTimeout(checkForTweet, config.twitter.app.refreshDelay);
            console.log(league.leagueInfo.leagueName + '-TwitGame: Tweet successful');
          }
        });
      } else {
        looping = false;
      }
    });
  };

  this.tweet = function() {
    if (!looping && !throttled) {
      looping = true;
      checkForTweet();
    }
  };

  this.start = function() {
    if (typeof twit === 'undefined') {
      console.log(league.leagueInfo.leagueName + ': Can not start TwitGame, check config.');
    } else {
      console.log(league.leagueInfo.leagueName + ': starting TwitGame');
      db.connect(config, league.leagueInfo.leagueName + ' TwitGame', function startLoop(err) {
        if (err) {
          console.log(league.leagueInfo.leagueName + ': TwitGame can not connect to DB. ' + JSON.stringify(err));
        } else {
          ready = true;
          checkForTweet();
        }
      });
    }
  };

  this.end = function() {
    console.log(league.leagueInfo.leagueName + ': ending TwitGame');
    db.disconnect();
    ready = false;
  };
};

util.inherits(TwitGame, events.EventEmitter);

module.exports = TwitGame;