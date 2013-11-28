var NHLScore = {
	leagueName: 'NHL',
	updateURL: 'http://live.nhle.com/GameData/RegularSeasonScoreboardv3.jsonp',
	getGameArray: function(rawData) {
		rawData = rawData.replace('loadScoreboard(','');
		rawData = rawData.substring(0,(rawData.length-2));
		var rawArray = JSON.parse(rawData).games;
		var gameArray = [];
		for (var i = 0; i < rawArray.length; i++) {
			gameArray.push(this.parseRawGame(rawArray[i]));
		}
		return gameArray;
	},
	parseRawGame: function(rawGame) {
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
	},
	gameChanged: function(oldGame, newGame) {
		return (oldGame.GameID === newGame.GameID) &&
			(	(oldGame.State !== newGame.State) ||
				(oldGame.Period !== newGame.Period) ||
				(oldGame.AwayScore !== newGame.AwayScore) ||
				(oldGame.HomeScore !== newGame.HomeScore));
	},
	makeGameLink: function(game) {
		var linkStub = 'http://www.nhl.com/gamecenter/en/icetracker?id=';
		return linkStub + game.gameId;
	}
};

module.exports = NHLScore;