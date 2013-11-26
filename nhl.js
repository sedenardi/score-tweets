var NHLScore = {
	league: 'NHL',
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
				gameState = 'scheduled';
				var arr = rawGame.ts.split(' ');
				var dateArr = arr[arr.length-1].split('/');
				date.setMonth(parseInt(dateArr[0])-1);
				date.setDate(parseInt(dateArr[1]));
				break;
			case '3':
				if (rawGame.ts.indexOf('END') !== -1) {
					gameState = 'intermission';
				} else {
					gameState = 'progress';
				}
				timeString = rawGame.ts.split(' ')[0];
				periodString = rawGame.ts.split(' ')[1];
				break;
			case '4':
				if (rawGame.ts.indexOf('SHOOTOUT') !== -1) {
					gameState = 'shootout';
				} else {
					gameState = 'overtime';
					timeString = rawGame.ts.split(' ')[0];
					periodString = rawGame.ts.split(' ')[1];
				}
				break;
			case '5':
				gameState = 'ended';
				var arr = rawGame.ts.split(' ');
				var dateArr = arr[arr.length-1].split('/');
				date.setMonth(parseInt(dateArr[0])-1);
				date.setDate(parseInt(dateArr[1]));
				break;
		}
		game.gameId = rawGame.id;
		game.state = gameState;
		game.date = date.toDateString();
		game.time = timeString;
		game.period = periodString;
		game.awayTeamCity = rawGame.atn;
		game.awayTeamName = rawGame.atv;
		game.awayScore = rawGame.ats;
		game.homeTeamCity = rawGame.htn;
		game.homeTeamName = rawGame.htv;
		game.homeScore = rawGame.hts;
		return game;
	},
	makeGameLink: function(game) {
		var linkStub = 'http://www.nhl.com/gamecenter/en/icetracker?id=';
		return linkStub + game.gameId;
	}
};

module.exports = NHLScore;