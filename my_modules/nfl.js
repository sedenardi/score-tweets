var http = require('http')
,	moment = require('../node_modules/moment');

var leagueInfo = {
	leagueName: 'NFL',
	updateURL: 'http://www.nfl.com/liveupdate/scorestrip/ss.json',
	updateURL2: 'http://www.nfl.com/liveupdate/scorestrip/scorestrip.json'
};

var getGameArray = function(next) {
	var rawOuter = '';
	var outerRequest = http.get(leagueInfo.updateURL, function(oRes) {
		oRes.on('data', function(chunk) {
			rawOuter += chunk;
		});
		oRes.on('end', function() {
			var rawInner = '';
			var innerRequest = http.get(leagueInfo.updateURL2, function(iRes) {
				iRes.on('data', function(chunk) {
					rawInner += chunk;
				});
				iRes.on('end', function() {
					try {
						rawInner = rawInner.replace(/\,\,/g,',"",');
						rawInner = rawInner.replace(/\,\,/g,',"",');
						innerArray = JSON.parse(rawInner).ss;
						var innerObj = { };
						for (var i = 0; i < innerArray.length; i++) {
							innerObj[innerArray[i][10]] = innerArray[i];
						}
						outerObj = JSON.parse(rawOuter);
						var gameArray = [];
						for (var i = 0; i < outerObj.gms.length; i++) {
							outerObj.gms[i].outer_w = outerObj.w;
							outerObj.gms[i].outer_t = outerObj.t;
							outerObj.gms[i].outer_y = outerObj.y;
							outerObj.gms[i].outer_gd = outerObj.gd;
							outerObj.gms[i].outer_bph = outerObj.bph;
							outerObj.gms[i].score_array = innerObj[outerObj.gms[i].gsis];
							gameArray.push(parseRawGame(outerObj.gms[i]));
						}
						next(gameArray);
					} catch(e) {
						console.log('NFL parsing error: ' + e);
					}
				});
			}).on('error', function(e) {
				console.log('NFL inner http Error: ' + e.message);
			});
		});
	}).on('error', function(e) {
		console.log('NFL outer http Error: ' + e.message);
	});
};

var parseRawGame = function(rawGame) {
	var game = { };
	var gameState = '';
	var timeString = rawGame.t;
	switch(rawGame.q) {
		case 'P':
			gameState = 'Scheduled';
			break;
		case 'H':
			gameState = 'Halftime';
			break;
		case 'F':
			gameState = 'Ended';
			break;
		case 'FO':
			gameState = 'Ended';
			break;
		case '5':
			gameState = 'Overtime';
			break;
		default:
			gameState = 'Progress';
			timeString = rawGame.score_array[3];
			break;
	}
	var endIndex = rawGame.eid.toString().length - 2;
	var dateStr = rawGame.eid.toString().substr(0,endIndex);
	var gameDate = moment(dateStr ,'YYYYMD').toDate();
	game.GameSymbol = rawGame.eid.toString();
	game.State = gameState;
	game.Date = gameDate;
	game.SeasonYear = rawGame.outer_y;
	game.SeasonType = rawGame.outer_t;
	game.SeasonWeek = rawGame.outer_w;
	game.Time = timeString;
	game.Quarter = rawGame.q;
	game.AwayTeamDisplayName = rawGame.v;
	game.AwayTeamName = rawGame.vnn;
	game.AwayScore = rawGame.vs;
	game.HomeTeamDisplayName = rawGame.h;
	game.HomeTeamName = rawGame.hnn;
	game.HomeScore = rawGame.hs;
	game.RawInstance = JSON.stringify(rawGame,null,2);
	return game;
};

var gameChanged = function(oldGame, newGame) {
	return (oldGame.GameSymbol === newGame.GameSymbol) &&
		(	(oldGame.State !== newGame.State) ||
			(oldGame.Quarter !== newGame.Quarter) ||
			(oldGame.AwayScore !== newGame.AwayScore) ||
			(oldGame.HomeScore !== newGame.HomeScore));
};

var gameChangeString = function(oldGame, newGame) {
	var dif = [];
	if (oldGame.State !== newGame.State)
		dif.push(oldGame.State + '-' + newGame.State);
	if (oldGame.Quarter !== newGame.Quarter)
		dif.push(oldGame.Quarter + '-' + newGame.Quarter);
	if (oldGame.AwayScore !== newGame.AwayScore)
		dif.push(oldGame.AwayScore + '-' + newGame.AwayScore);
	if (oldGame.HomeScore !== newGame.HomeScore)
		dif.push(oldGame.HomeScore + '-' + newGame.HomeScore);
	return dif.join(',');
};

var makeGameLink = function(game) {
	var link = 'http://www.nfl.com/gamecenter/' +
	game.GameID + '/' + game.SeasonYear + '/' + game.SeasonType + 
	game.SeasonWeek + '/' + game.AwayTeamName + '@' + game.HomeTeamName;
	return link;
};

var insertGameQuery = function(game) {
	var stmnt = 
		'Insert into NFLGames(GameSymbol,Date,SeasonYear,SeasonType,\
			SeasonWeek,AwayTeamID,HomeTeamID)\
		Select\
			?,?,?,?,?,away.TeamID,home.TeamID\
		from NFLTeams away\
			inner join NFLTeams home\
				on LOWER(REPLACE(home.Name,\' \',\'\')) like ?\
		where LOWER(REPLACE(away.Name,\' \',\'\')) like ?\
		and not exists\
			(Select 1 from NFLGames where GameSymbol like ?);';
	var params = [game.GameSymbol, game.Date, game.SeasonYear, game.SeasonType,
		game.SeasonWeek, game.HomeTeamName, game.AwayTeamName, game.GameSymbol];
	return {
		sql: stmnt,
		inserts: params
	};
};

var insertGameInstanceQuery = function(game) {
	var stmnt = 
		'Insert into NFLGameInstances(GameID,StateID,Time,\
			Quarter,AwayScore,HomeScore,RawInstance)\
		Select\
			game.GameID,state.StateID,?,?,?,?,?\
		from NFLStates state\
			inner join NFLGames game\
				on game.GameSymbol like ?\
		where state.State = ?;';
	var params = [game.Time, game.Quarter, game.AwayScore,
		game.HomeScore, game.RawInstance, game.GameSymbol, game.State];
	return {
		sql: stmnt,
		inserts: params
	};
};

var lastGameInstanceQuery = function(game) {
	var stmnt = 
		'Select\
			game.GameSymbol\
		,	game.Date\
		,	state.State\
		,	game.SeasonYear\
		,	game.SeasonType\
		,	game.SeasonWeek\
		,	instance.Time\
		,	instance.Quarter\
		,	away.City as AwayTeamCity\
		,	away.Name as AwayTeamName\
		,	away.DisplayName as AwayTeamDisplayName\
		,	away.TwitterAccount as AwayTwitterAccount\
		,	away.TwitterHashtag as AwayTwitterHashtag\
		,	instance.AwayScore\
		,	home.City as HomeTeamCity\
		,	home.Name as HomeTeamName\
		,	home.DisplayName as HomeTeamDisplayName\
		,	home.TwitterAccount as HomeTwitterAccount\
		,	home.TwitterHashtag as HomeTwitterHashtag\
		,	instance.HomeScore\
		from NFLGameInstances instance\
			inner join NFLGames game\
				on game.GameID = instance.GameID\
				and game.GameSymbol like ?\
			inner join NFLStates state\
				on state.StateID = instance.StateID\
			inner join NFLTeams away\
				on away.TeamID = game.AwayTeamID\
			inner join NFLTeams home\
				on home.TeamID = game.HomeTeamID\
		order by ?? desc limit 1;';
	var params = [game.GameSymbol, 'instance.RecordedOn'];
	return {
		sql: stmnt,
		inserts: params
	};
};

module.exports.leagueInfo = leagueInfo;
module.exports.getGameArray = getGameArray;
module.exports.parseRawGame = parseRawGame;
module.exports.gameChanged = gameChanged;
module.exports.gameChangeString = gameChangeString;
module.exports.makeGameLink = makeGameLink;
module.exports.insertGameQuery = insertGameQuery;
module.exports.insertGameInstanceQuery = insertGameInstanceQuery;
module.exports.lastGameInstanceQuery = lastGameInstanceQuery;