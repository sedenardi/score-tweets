var NHLScore = {
	league: 'NHL',
	updateURL: 'http://live.nhle.com/GameData/RegularSeasonScoreboardv3.jsonp',
	getGameArray: function(rawData) {
		rawData = rawData.replace('loadScoreboard(','');
		rawData = rawData.substring(0,(rawData.length-2));
		return JSON.parse(rawData).games;
	},
	parseRawGame: function(rawGame) {
		var date = new Date();
		var arr = rawGame.ts.split(' ');
		var dateArr = arr[arr.length-1].split('/');
		d.setMonth(parseInt(dateArr[0])-1);
		d.setDate(parseInt(dateArr[1]));
		var gameState = '';
		switch (rawGame.gs) {
			case '1':
				gameState = 'scheduled';
				var arr = rawGame.ts.split(' ');
				var dateArr = arr[arr.length-1].split('/');
				d.setMonth(parseInt(dateArr[0])-1);
				d.setDate(parseInt(dateArr[1]));
				break;
			case '3':
				if (rawGame.ts.indexOf('END') !== -1) {
					gameState = 'intermission';
				} else {
					gameState = 'progress';
				}
				break;
			case '4':
				if (rawGame.ts.indexOf('SHOOTOUT') !== -1) {
					gameState = 'shootout';
				} else {
					gameState = 'overtime';
				}
				break;
			case '5':
				gameState = 'ended';
				var arr = rawGame.ts.split(' ');
				var dateArr = arr[arr.length-1].split('/');
				d.setMonth(parseInt(dateArr[0])-1);
				d.setDate(parseInt(dateArr[1]));
				break;
		}
		this.gameId = rawGame.id;
		this.state = gameState;
		this.date = date.toDateString();
		this.gameTime = rawGame.tsc;
		this.awayTeam = rawGame.atn;
		this.awayScore = rawGame.ats;
		this.homeTeam = rawGame.htn;
		this.homeScore = rawGame.hts;
	},
	makeGameLink: function() {
		var linkStub = 'http://www.nhl.com/gamecenter/en/icetracker?id=';
		return linkStub + this.gameId;
	}
};

module.exports = NHLScore;