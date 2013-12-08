var events = require('events'),
  util = require('util'),
  http = require('http'),
  db = require('../db/db.js');

var LeagueManager = function(config, l) {
  var self = this;
  var league = l;
  var loopInterval = null;
  var started = false;
  this.start = function() {
    if (loopInterval !== null) {
      console.log('Can not start LeagueManager, already running');
    } else if (typeof league === 'undefined') {
      console.log('Can not start LeagueManager, league is undefined. Call \'setLeague\' first.');
    } else if (typeof config.leagues[league.leagueInfo.leagueName].refreshInterval === 'undefined') {
      condole.log('Can not start LeagueManager, missing refresl interval in config');
    } else {
      console.log(league.leagueInfo.leagueName + ': starting League Manager');
      db.connect(config, league.leagueInfo.leagueName + ' LeagueManager', function startLoop(err) {
        if (err) {
          console.log(league.leagueInfo.leagueName + ': LeagueManager can not connect to DB. ' + JSON.stringify(err));
        } else {
          loopInterval = setInterval(loop, config.leagues[league.leagueInfo.leagueName].refreshInterval);
          loop();
          started = true;
        }
      });
    }
  };

  this.end = function() {
    if (loopInterval === null) {
      console.log('Can not end process, not running');
    }
    console.log(league.leagueInfo.leagueName + ': ending League Manager');
    clearInterval(loopInterval);
    db.disconnect();
    started = false;
  };

  var loop = function() {
    league.getGameArray(processGames);
  };

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
    if (tweet) {
      var cmd = league.insertGameChangeTweetQuery(tweet);
      db.query(cmd, next);
    }
  };
  
  console.log('LeagueManager created with league: ' + league.leagueInfo.leagueName);
};

util.inherits(LeagueManager, events.EventEmitter);

module.exports = LeagueManager;