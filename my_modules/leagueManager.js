var http = require('http'),
  db = require('./db.js'),
  config = require('./config.js');

module.exports.LeagueManager = function LeagueManager(l) {
  var league = l;
  var loopInterval;

  this.startProcess = function startProcess() {
    if (typeof league === 'undefined') {
      console.log('Can not start process, league is undefined. Call \'setLeague\' first.');
    } else if (typeof config.leagues[league.leagueInfo.leagueName].refreshInterval === 'undefined') {
      condole.log('Can not start provess, missing refresl interval in config');
    } else {
      console.log(league.leagueInfo.leagueName + ': starting process');
      db.connect(league.leagueInfo.leagueName, function() {
        loopInterval = setInterval(loop, config.leagues[league.leagueInfo.leagueName].refreshInterval);
        loop();
      });
    }
  };

  this.endProcess = function endProcess() {
    console.log(league.leagueInfo.leagueName + ': ending process');
    clearInterval(loopInterval);
    db.disconnect();
  };

  var loop = function loop() {
    league.getGameArray(processGames);
  }

  var processGames = function processGames(err, games) {
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

  var processInstance = function processInstance(oldGame, newGame) {
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

  var insertGame = function insertGame(game, next) {
    var cmd = league.insertGameQuery(game);
    db.query(cmd.sql, cmd.inserts, next);
  };

  var insertGameInstance = function insertGameInstance(game, next) {
    var cmd = league.insertGameInstanceQuery(game);
    db.query(cmd.sql, cmd.inserts, next);
  }

  var getLastGameInstance = function getLastGameInstance(game, next) {
    var cmd = league.lastGameInstanceQuery(game);
    db.query(cmd.sql, cmd.inserts, next);
  };
};