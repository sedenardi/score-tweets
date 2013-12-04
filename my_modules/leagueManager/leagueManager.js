var http = require('http'),
  db = require('../db/db.js'),
  config = require('../config.js');

exports.LeagueManager = function(l) {
  var league = l;
  var loopInterval;
  var started = false;
  this.startProcess = function() {
    if (typeof league === 'undefined') {
      console.log('Can not start process, league is undefined. Call \'setLeague\' first.');
    } else if (typeof config.leagues[league.leagueInfo.leagueName].refreshInterval === 'undefined') {
      condole.log('Can not start provess, missing refresl interval in config');
    } else {
      console.log(league.leagueInfo.leagueName + ': starting process');
      db.connect(league.leagueInfo.leagueName, function startLoop() {
        loopInterval = setInterval(loop, config.leagues[league.leagueInfo.leagueName].refreshInterval);
        loop();
        started = true;
      });
    }
  };

  this.endProcess = function() {
    console.log(league.leagueInfo.leagueName + ': ending process');
    clearInterval(loopInterval);
    db.disconnect();
    started = false;
  };

  var loop = function() {
    league.getGameArray(processGames);
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
  }

  var processInstance = function(oldGame, newGame) {
    if (oldGame.length) {
      var changed = league.gameChanged(oldGame[0], newGame);
      if (changed) {
        console.log(league.leagueInfo.leagueName + ': ' + newGame.GameSymbol + ' changed, ' + league.gameChangeString(oldGame[0], newGame));
        insertGameInstance(newGame, function insertGameInstanceFinished() {
          console.log(league.leagueInfo.leagueName + ': Inserted new instance of ' + newGame.GameSymbol);
        });
      }
    } else {
      insertGameInstance(newGame, function insertGameInstanceFinished() {
        console.log(league.leagueInfo.leagueName + ': Inserted instance of ' + newGame.GameSymbol);
      });
    }
  };

  var insertGame = function(game, next) {
    var cmd = league.insertGameQuery(game);
    db.query(cmd.sql, cmd.inserts, next);
  };

  var insertGameInstance = function(game, next) {
    var cmd = league.insertGameInstanceQuery(game);
    db.query(cmd.sql, cmd.inserts, next);
  }

  var getLastGameInstance = function(game, next) {
    var cmd = league.lastGameInstanceQuery(game);
    db.query(cmd.sql, cmd.inserts, next);
  };
  
  console.log('LeagueManager created with league: ' + league.leagueInfo.leagueName);
};