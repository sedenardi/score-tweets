var events = require('events'),
  util = require('util'),
  http = require('http'),
  db = require('../db/db.js'),
  moment = require('moment');

var LeagueManager = function(config, l) {

  var statuses = {
    stopped: 'Stopped',
    looping: 'Looping quickly',
    throttled: 'Looping slowly'
  };

  var self = this,
    league = l,
    loopInterval = null,
    status = statuses.stopped,
    throttleCheck = false;

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

  var loop = function() {
    if (throttleCheck) {
      console.log(league.leagueInfo.leagueName + ': Throttle Check');
      checkForThrottle();
    } else {
      if (status === statuses.throttled) {
        restoreLoop();
      } 
      throttleCheck = true;
      league.getGameArray(processGames);
    }
  };

  var checkForThrottle = function() {
    var cmd = league.nextGameQuery();
    db.query(cmd, function checkNext(nextGame){
      if (nextGame.length) {
        if (nextGame[0].StartTime) {
          var duration = moment.duration(moment(nextGame[0].StartTime) - moment());
          if (duration.asHours() > 25) {
            //over a day away, don't check again for a day
            throttleLoop(86400000);
          } else if (duration.asHours() > 1.5) {
            //over an hour away, don't check again for an hour
            throttleLoop(3600000);
          } else if (duration.asMinutes() > 10) {
            //over 10 min away, don't check again for 10 min
            throttleLoop(600000);
          } else if (duration.asMinutes() > 1.5) {
            //over 1 min away, don't check again for 1 min
            throttleLoop(60000);
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

  var throttleLoop = function(delay) {
    console.log(league.leagueInfo.leagueName + ': Throttling loop ' + delay);
    if (typeof delay === 'undefined') {
      delay = config.leagues[league.leagueInfo.leagueName].throttleInterval;
    }
    clearInterval(loopInterval);
    loopInterval = setInterval(loop, delay);
    status = statuses.throttled;
  };

  var restoreLoop = function() {
    console.log(league.leagueInfo.leagueName + ': Restoring loop');
    clearInterval(loopInterval);
    loopInterval = setInterval(loop, config.leagues[league.leagueInfo.leagueName].loopInterval);
    status = statuses.looping;
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
      insertGameInstance(newGame, function insertGameInstanceFinished() {
        console.log(league.leagueInfo.leagueName + ': Inserted new game: ' + newGame.GameSymbol);
      });
    }
    throttleCheck = throttleCheck && !league.gameInProgress(newGame);
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