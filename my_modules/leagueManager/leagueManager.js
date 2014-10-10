var events = require('events'),
  util = require('util'),
  http = require('http'),
  db = require('../db/db.js'),
  moment = require('moment');

var LeagueManager = function(config, l) {

  var statuses = {
    stopped: 'stopped',
    firstLoop: 'firstLoop',
    looping: 'looping',
    throttled: 'throttled'
  }, statusDescriptions = {
    stopped: 'Stopped, able to be started',
    firstLoop: 'Looping through the first time to detect the next game',
    looping: 'Looping quickly, games are ongoing',
    throttled: 'Looping slowly, no games currently ongoing'
  };

  var self = this,
    league = l,
    loopInterval = null,
    status = statuses.stopped,
    throttleInfo = {},
    firstRun = true;

  this.start = function() {
    if (loopInterval !== null) {
      console.log('Can not start LeagueManager, already running');
    } else if (typeof league === 'undefined') {
      console.log('Can not start LeagueManager, league is undefined. Call \'setLeague\' first.');
    } else if (typeof config.leagues[league.leagueInfo.leagueName].loopInterval === 'undefined') {
      condole.log('Can not start LeagueManager, missing refresh interval in config');
    } else {
      console.log(league.leagueInfo.leagueName + ': starting League Manager');
      db.connect(config, league.leagueInfo.leagueName + ' LeagueManager', function startLoop(err) {
        if (err) {
          console.log(league.leagueInfo.leagueName + ': LeagueManager can not connect to DB. ' + JSON.stringify(err));
        } else {
          restoreLoop();
          loop();
        }
      });
    }
  };

  this.end = function() {
    if (loopInterval === null) {
      console.log('Can not end process, not running');
      return;
    }
    console.log(league.leagueInfo.leagueName + ': ending League Manager');
    clearInterval(loopInterval);
    loopInterval = null;
    db.disconnect();
    status = statuses.stopped;
  };

  var sendStatus = function() {
    var s = {};
    s.league = league.leagueInfo.leagueName;
    s.status = status;
    s.statusDescription = statusDescriptions[status];
    if (status === statuses.throttled) {
      s.throttleInfo = throttleInfo;
    }
    self.emit('status', s);
  }

  var loop = function() {
    var ongoing = league.ongoingGamesQuery();
    db.query(ongoing, function ongoingGames(res) {
      console.log(league.leagueInfo.leagueName + ': Games in progress - ' + res.length);
      if (res.length === 0) {
        checkForThrottle();
      } else {
        if (status !== statuses.looping) {
          restoreLoop();
        }
        league.getGameArray(processGames);
      }
    });
  };

  var checkForThrottle = function() {
    var cmd = league.nextGameQuery();
    db.query(cmd, function checkNext(nextGame){
      if (nextGame.length) {
        if (nextGame[0].StartTime) {
          if (moment.duration(moment(nextGame[0].StartTime) - moment()).asMinutes() < 0) {
            restoreLoop();
          } else {
            throttleLoop(nextGame[0].StartTime);
          }
        } else {
          throttleLoop();
        }
      } else {
        //no next game scheduled
        throttleLoop();
      }
      league.getGameArray(processGames);
    });
  };

  var throttleLoop = function(startTime) {
    var delay = parseInt(config.leagues[league.leagueInfo.leagueName].throttleInterval);
    var duration;
    if (startTime) {
      duration = moment.duration(moment(startTime) - moment());
      if (duration.asHours() > 25) {
        //over a day away, don't check again for a day
        delay = 86400000;
      } else if (duration.asHours() > 1.5) {
        //over an hour away, don't check again for an hour
        delay = 3600000;
      } else if (duration.asMinutes() > 10) {
        //over 10 min away, don't check again for 10 min
        delay = 600000;
      } else if (duration.asMinutes() > 1.5) {
        //over 1 min away, don't check again for 1 min
        delay = 60000;
      } else {
        delay = 60000;
      }
      throttleInfo.duration = duration.asSeconds();
    }
    if (firstRun) {
      delay = config.leagues[league.leagueInfo.leagueName].loopInterval;
      status = statuses.firstLoop;
      firstRun = false;
    } else {
      status = statuses.throttled;
    }
    console.log(league.leagueInfo.leagueName + ': Throttling loop ' + delay);
    clearInterval(loopInterval);
    loopInterval = setInterval(loop, delay);
    throttleInfo.delay = delay;
    if (startTime) {
      throttleInfo.nextStartTime = startTime.toLocaleString(); 
    } else {
      throttleInfo.nextStartTime = null;
    }
    throttleInfo.throttleTime = moment().toDate().toLocaleString();
    throttleInfo.nextCheck = moment().add(delay).toDate().toLocaleString();
    sendStatus();
    var e = {
      source: league.leagueInfo.leagueName,
      message: 'Throttling for ' + delay + 'ms',
      stack: 'ThrottleInfo: ' + JSON.stringify(throttleInfo)
    };
    db.logError(e,function(){});
  };

  var restoreLoop = function() {
    console.log(league.leagueInfo.leagueName + ': Restoring loop');
    clearInterval(loopInterval);
    loopInterval = setInterval(loop, config.leagues[league.leagueInfo.leagueName].loopInterval);
    status = statuses.looping;
    sendStatus();
  }

  var processGames = function(err, games) {
    if (err) {
      db.logError(err,function(){});
      return;
    }
    console.log(league.leagueInfo.leagueName + ': processing ' + games.length + ' games @ ' + (new Date()).toLocaleString());
    for (var i = 0; i < games.length; i++) {
      //console.log(league.leagueInfo.leagueName + ': processing ' + games[i].GameID);
      (function process(game){
        insertGame(game, function insertGameFinished(){
          getLastGameInstance(game, function getLastGameInstanceFinished(oldGame){
            processInstance(oldGame, game);
          });
        });
      }(games[i]));
    }
  };

  var processInstance = function(oldGame, newGame) {
    if (oldGame.length) {
      var changed = league.gameChanged(oldGame[0], newGame);
      if (changed) {
        console.log(league.leagueInfo.leagueName + ': ' + newGame.GameSymbol + ' changed, ' + league.gameChangeString(oldGame[0], newGame));
        insertGameInstance(newGame, function insertGameInstanceFinished(result) {
          newGame.InstanceID = result.insertId;
          console.log(league.leagueInfo.leagueName + ': Inserted new instance of: ' + newGame.GameSymbol);
          var changeObj = {
            league: league,
            oldGame: oldGame[0],
            newGame: newGame
          };
          insertGameChangeTweet(changeObj, function insertTweetFinished() {
            console.log(league.leagueInfo.leagueName + ': Created new tweet for: ' + newGame.GameSymbol);
            self.emit('change', changeObj);
          });
        });
      }
    } else {
      insertGameInstance(newGame, function insertGameInstanceFinished(res) {
        if (res.insertId) {
          console.log(league.leagueInfo.leagueName + ': Inserted new game: ' + newGame.GameSymbol);
        }
      });
    }
  };

  var insertGame = function(game, next) {
    var cmd = league.insertGameQuery(game);
    db.query(cmd, next);
  };

  var insertGameInstance = function(game, next) {
    var cmd = league.insertGameInstanceQuery(game);
    db.query(cmd, next);
  };

  var getLastGameInstance = function(game, next) {
    var cmd = league.lastGameInstanceQuery(game);
    db.query(cmd, next);
  };

  var insertGameChangeTweet = function(changeObj, next) {
    var tweet = league.gameChangeTweet(changeObj.oldGame, changeObj.newGame);
    if (tweet.TweetString.length) {
      var cmd = league.insertGameChangeTweetQuery(tweet);
      db.query(cmd, next);
    }
  };
  
  console.log('LeagueManager created with league: ' + league.leagueInfo.leagueName);
};

util.inherits(LeagueManager, events.EventEmitter);

module.exports = LeagueManager;
