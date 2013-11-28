var NHLModel = require('./nhl_model.js')
,	http = require('http')
,	db = require('./db.js');

var league = Object.create(NHLModel);
var loopInterval;

var loop = function() {
	league.getGameArray(processGames);
}

var processGames = function(games) {
	console.log(league.leagueInfo.leagueName + ': processing ' + games.length + ' games @ ' + (new Date()).toLocaleString());
	for (var i = 0; i < games.length; i++) {
		//console.log(league.leagueInfo.leagueName + ': processing ' + games[i].GameID);
		(function process(game){
			var cmd = league.existsQuery(game);
			db.exists(cmd.sql, cmd.inserts, function (res) {
				if (res) {
					getLastGameInstance(game, function(res) {
						var changed = league.gameChanged(res, game);
						if (changed) {
							console.log(league.leagueInfo.leagueName + ': ' + game.GameID + ' changed, ' + league.gameChangeString(res, game));
							game.Date = res.Date;
							insertGame(game, function() {
								console.log(league.leagueInfo.leagueName + ': Inserted new instance of ' + game.GameID);
							});
						} else {
							//console.log(league.leagueInfo.leagueName + ': ' + game.GameID + ' game not changed');
						}
					});
				} else {
					console.log(league.leagueInfo.leagueName + ': ' + game.GameID + ' does not exist');
					insertGame(game, function() {
						console.log(league.leagueInfo.leagueName + ': Inserted ' + game.GameID);
					});
				}
			});
		}(games[i]));
	}
}

var insertGame = function(game, next) {
	var cmd = league.insertGameQuery(game);
	db.query(cmd.sql, cmd.inserts, next);
}

var getLastGameInstance = function(game, next) {
	var cmd = league.lastGameInstanceQuery(game);
	db.query(cmd.sql, cmd.inserts, function(res) {
		next(res[0]);
	});
};

/***** EXPORTS *****/
module.exports.league = league;

module.exports.startProcess = function(interval) {
	console.log(league.leagueInfo.leagueName + ': starting process');
	db.connect(function() {
		loopInterval = setInterval(loop, interval);
		loop();
	});	
};

module.exports.endProcess = function() {
	console.log(league.leagueInfo.leagueName + ': ending process');
	clearInterval(loopInterval);
	db.disconnect();
};