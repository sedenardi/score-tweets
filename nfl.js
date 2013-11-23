var NFLScore = {
	league: 'NFL',
	updateURL: 'http://www.nfl.com/liveupdate/scorestrip/scorestrip.json',
	getGameArray: function(rawData) {
		rawData = rawData.replace(/\,\,/g,',"",');
		rawData = rawData.replace(/\,\,/g,',"",');
		return JSON.parse(rawData).ss;
	},
	parseRawGame: function(rawGame) {
		var gameDate; //make date from rawGame data
		var gameState; //make state from rawGame
		this.gameId = rawGame.id;
		this.state = gameState;
		this.date = gameDate;
		this.gameTime = rawGame.tsc;
		this.awayTeam = rawGame.atn;
		this.awayScore = rawGame.ats;
		this.homeTeam = rawGame.htn;
		this.homeScore = rawGame.hts;
	},
	makeGameLink: function() {
		var linkStub = '';
		return linkStub + this.gameId;
	}
};

module.exports = NFLScore;