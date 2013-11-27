var NHLModel = require('./nhl_model.js')
,	http = require('http')
,	db = require('./db.js');

var league = Object.create(NHLModel);
var loopInterval;

var loop = function() {
	var rawResponse = '';
	var request = http.get(league.updateURL, function(res) {
		res.on('data', function(chunk) {
			rawResponse += chunk;
		});
		res.on('end', function() {
			var games = league.getGameArray(rawResponse);
			processGames(games);
		});
	}).on('error', function(e) {
		console.log('Error: ' + e.message);
	});
}

var processGames = function(games) {
	console.log(league.leagueName + ': processing ' + games.length + ' games @ ' + (new Date()).toLocaleString());
	for (var i = 0; i < games.length; i++) {
		//console.log(league.leagueName + ': processing ' + games[i].GameID);
		(function process(game){
			db.exists('Select 1 from NHLGameInstances where GameID = ?', [game.GameID], function (res) {
				if (res) {
					//console.log(league.leagueName + ': ' + game.GameID + ' does exist');
					getLastGameInstance(game, function(res) {
						var changed = league.gameChanged(res, game);
						if (changed) {
							insertGame(game, function() {
								console.log(league.leagueName + ': Inserted ' + game.GameID);
							});
						} else {
							//console.log(league.leagueName + ': ' + game.GameID + ' game not changed');
						}
					});
				} else {
					console.log(league.leagueName + ': ' + game.GameID + ' does not exist');
					insertGame(game, function() {
						console.log(league.leagueName + ': Inserted ' + game.GameID);
					});
				}
			});
		}(games[i]));
	}
}

var insertGame = function(game, next) {
	var insertSql = 
		'Insert into NHLGameInstances(GameID,Date,StateID,Time,\
			Period,AwayTeamID,AwayScore,HomeTeamID,HomeScore)\
		Select\
			?,?,state.StateID,?,?,away.TeamID,?,home.TeamID,?\
		from NHLStates state\
			inner join NHLTeams away\
				on LOWER(REPLACE(away.Name,\' \',\'\')) like ?\
			inner join NHLTeams home\
				on LOWER(REPLACE(home.Name,\' \',\'\')) like ?\
		where state.State = ?;';
	var inserts = [game.GameID, game.Date, game.Time, game.Period, game.AwayScore,
		game.HomeScore, game.AwayTeamName, game.HomeTeamName, game.State];
	db.query(insertSql, inserts, next);
}

var getLastGameInstance = function(game, next) {
	var sql = 
		'Select\
			game.GameID\
		,	game.Date\
		,	state.State\
		,	game.Time\
		,	game.Period\
		,	away.City as AwayTeamCity\
		,	away.Name as AwayTeamName\
		,	away.DisplayName as AwayDisplayName\
		,	away.TwitterAccount as AwayTwitterAccount\
		,	away.TwitterHashtag as AwayTwitterHashtag\
		,	game.AwayScore\
		,	home.City as HomeTeamCity\
		,	home.Name as HomeTeamName\
		,	home.DisplayName as HomeDisplayName\
		,	home.TwitterAccount as HomeTwitterAccount\
		,	home.TwitterHashtag as HomeTwitterHashtag\
		,	game.HomeScore\
		from NHLGameInstances game\
			inner join NHLStates state\
				on state.StateID = game.StateID\
			inner join NHLTeams away\
				on away.TeamID = game.AwayTeamID\
			inner join NHLTeams home\
				on home.TeamID = game.HomeTeamID\
		where GameID = ? order by ?? desc limit 1;';
	var inserts = [game.GameID, 'RecordedOn'];
	db.query(sql, inserts, function(res) {
		next(res[0]);
	});
};

/***** EXPORTS *****/
module.exports.league = league;

module.exports.startProcess = function(interval) {
	console.log(league.leagueName + ': starting process');
	db.connect(function() {
		loopInterval = setInterval(loop, interval);
		loop();
	});	
};

module.exports.endProcess = function() {
	console.log(league.leagueName + ': ending process');
	clearInterval(loopInterval);
	db.disconnect();
};