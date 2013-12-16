var twitter = require('ntwitter'),
  db = require('../db/db.js'),
  events = require('events'),
  util = require('util');

var TwitGame = function(config, league) {

  var statuses = {
    stopped: 'stopped',
    idle: 'idle',
    looping: 'looping',
    throttled: 'throttled'
  }, statusDescriptions = {
    stopped: 'Stopped, able to be started',
    idle: 'Not looping or waiting',
    looping: 'Looping through work to do',
    throttled: 'Waiting to try and send another tweet'
  };

  var self = this,
    status = statuses.stopped,
    logTag = league.leagueInfo.leagueName + '-TwitGame',
    accountName = config.leagues[league.leagueInfo.leagueName].twitterUser,
    twit;

  if (config.twitter.app.consumerKey &&
    config.twitter.app.consumerSecret &&
    config.twitter.accounts[accountName].access_token_key &&
    config.twitter.accounts[accountName].access_token_secret) {
    twit = new twitter({
      consumer_key: config.twitter.app.consumerKey,
      consumer_secret: config.twitter.app.consumerSecret,
      access_token_key: config.twitter.accounts[accountName].access_token_key,
      access_token_secret: config.twitter.accounts[accountName].access_token_secret
    });
  }

  var undoThrottle = function() {
    console.log(logTag + ': Undoing throttle');
    status = statuses.looping;
    sendStatus();
    checkForTweet();
  };

  var sendTweet = function(tweet, next) {
    twit.updateStatus(tweet.TweetString, function twitterResponse(err,data) {
      if (err){
        console.log(logTag + ': ERROR - ' + JSON.stringify(err));
        status = statuses.idle;
        if (typeof err.statusCode !== 'undefined' && err.statusCode === 403) {
          var errData;
          try {
            errData = JSON.parse(err.data);
          } catch (e) {
            console.log(logTag + ': update error - ' + JSON.stringify(e));
          }
          if (typeof errData !== 'undefined' && typeof errData.errors[0] !== 'undefined' &&
            errData.errors[0].code === 187) {
            console.log(logTag + ': SENT A DUPE, NO WAY JOSE!');
            updateTweet(tweet.TweetID, 'DUPE', next(null,'DUPE'));
          }
          else {
            console.log(logTag + ': throttling');
            status = statuses.throttled;
            setTimeout(undoThrottle,240000);
            var e = {
              source: 'TwitGame',
              message: 'ERROR',
              stack: 'Throttling'
            };
            db.logError(e, function(){});
          }
          sendStatus();
        }
      } else {
        updateTweet(tweet.TweetID, data.id_str, next);
      }
    });
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
            status = statuses.idle;
          } else {
            setTimeout(checkForTweet, config.twitter.app.refreshDelay);
            console.log(logTag + ': Tweet successful');
          }
        });
      } else {
        console.log(logTag + ': Nothing to tweet, going idle');
        status = statuses.idle;
      }
      sendStatus();
    });
  };

  var sendStatus = function() {
    var s = {};
    s.league = league.leagueInfo.leagueName;
    s.status = status;
    s.statusDescription = statusDescriptions[status];
    self.emit('status', s);
  };

  this.tweet = function() {
    if (status === statuses.throttled) {
      console.log(logTag + ': Throttled');
    } else if (status === statuses.idle) {
      status = statuses.looping;
      sendStatus();
      checkForTweet();
    }
  };

  this.start = function() {
    if (typeof twit === 'undefined') {
      console.log(logTag + ': Can not start TwitGame, check config.');
    } else {
      console.log(logTag + ': starting TwitGame');
      db.connect(config, logTag, function startLoop(err) {
        if (err) {
          console.log(logTag + ': TwitGame can not connect to DB. ' + JSON.stringify(err));
        } else {
          status = statuses.idle;
          sendStatus();
          checkForTweet();
        }
      });
    }
  };

  this.end = function() {
    console.log(logTag + ': ending TwitGame');
    db.disconnect();
    status = statuses.stopped;
    sendStatus();
  };
};

util.inherits(TwitGame, events.EventEmitter);

module.exports = TwitGame;