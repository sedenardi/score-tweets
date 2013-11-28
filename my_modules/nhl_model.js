var http = require('http');

var leagueInfo = {
	leagueName: 'NHL',
	updateURL: 'http://live.nhle.com/GameData/RegularSeasonScoreboardv3.jsonp'
};

var getGameArray = function(next) {
	var rawData = '';
	var request = http.get(leagueInfo.updateURL, function(res) {
		res.on('data', function(chunk) {
			rawData += chunk;
		});
		res.on('end', function() {
			rawData = rawData.replace('loadScoreboard(','');
			rawData = rawData.substring(0,(rawData.length-2));
			var rawArray = JSON.parse(rawData).games;
			var gameArray = [];
			for (var i = 0; i < rawArray.length; i++) {
				gameArray.push(parseRawGame(rawArray[i]));
			}
			next(gameArray);
		});
	}).on('error', function(e) {
		console.log('NHL Error: ' + e.message);
	});
};

var parseRawGame = function(rawGame) {
	var game = { };
	var date = new Date();
	var gameState = '';
	var timeString = '';
	var periodString = '';
	switch (rawGame.gs) {
		case '1':
			gameState = 'Scheduled';
			var arr = rawGame.ts.split(' ');
			var dateArr = arr[arr.length-1].split('/');
			date.setMonth(parseInt(dateArr[0])-1);
			date.setDate(parseInt(dateArr[1]));
			timeString = rawGame.bs;
			break;
		case '3':
			if (rawGame.ts.indexOf('END') !== -1) {
				gameState = 'Intermission';
			} else {
				gameState = 'Progress';
			}
			timeString = rawGame.ts.split(' ')[0];
			periodString = rawGame.ts.split(' ')[1];
			break;
		case '4':
			if (rawGame.ts.indexOf('SHOOTOUT') !== -1) {
				gameState = 'Shootout';
			} else {
				timeString = rawGame.ts.split(' ')[0];
				periodString = rawGame.ts.split(' ')[1];
				if (periodString === 'OT') {
					gameState = 'Overtime';
				} else if (periodString === 'SO') {
					gameState = 'Shootout';
				} else {
					gameState = 'Progress';
				}
			}
			break;
		case '5':
			gameState = 'Ended';
			var arr = rawGame.ts.split(' ');
			var dateArr = arr[arr.length-1].split('/');
			date.setMonth(parseInt(dateArr[0])-1);
			date.setDate(parseInt(dateArr[1]));
			break;
	}
	game.GameID = rawGame.id;
	game.Date = date;
	game.State = gameState;
	game.Time = timeString;
	game.Period = periodString;
	game.AwayTeamCity = rawGame.atn;
	game.AwayTeamName = rawGame.atv;
	game.AwayScore = (rawGame.ats === '' ? 0 : parseInt(rawGame.ats));
	game.HomeTeamCity = rawGame.htn;
	game.HomeTeamName = rawGame.htv;
	game.HomeScore = (rawGame.hts === '' ? 0 : parseInt(rawGame.hts));
	return game;
};

var gameChanged = function(oldGame, newGame) {
	return (oldGame.GameID === newGame.GameID) &&
		(	(oldGame.State !== newGame.State) ||
			(oldGame.Period !== newGame.Period) ||
			(oldGame.AwayScore !== newGame.AwayScore) ||
			(oldGame.HomeScore !== newGame.HomeScore));
};

var gameChangeString = function(oldGame, newGame) {
	var dif = [];
	if (oldGame.State !== newGame.State)
		dif.push(oldGame.State + '-' + newGame.State);
	if (oldGame.Period !== newGame.Period)
		dif.push(oldGame.Period + '-' + newGame.Period);
	if (oldGame.AwayScore !== newGame.AwayScore)
		dif.push(oldGame.AwayScore + '-' + newGame.AwayScore);
	if (oldGame.HomeScore !== newGame.HomeScore)
		dif.push(oldGame.HomeScore + '-' + newGame.HomeScore);
	return dif.join(',');
};

var makeGameLink = function(game) {
	var linkStub = 'http://www.nhl.com/gamecenter/en/icetracker?id=';
	return linkStub + game.gameId;
};

module.exports.leagueInfo = leagueInfo;
module.exports.getGameArray = getGameArray;
module.exports.parseRawGame = parseRawGame;
module.exports.gameChanged = gameChanged;
module.exports.gameChangeString = gameChangeString;
module.exports.makeGameLink = makeGameLink;