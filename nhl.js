var NHLScore = {
	league: 'NHL',
	updateURL: 'http://live.nhle.com/GameData/RegularSeasonScoreboardv3.jsonp',
	getGameArray: function(rawData) {
		rawData = rawData.replace('loadScoreboard(','');
		rawData = rawData.substring(0,(rawData.length-2));
		return JSON.parse(rawData).games;
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
		var linkStub = 'http://www.nhl.com/gamecenter/en/icetracker?id=';
		return linkStub + this.gameId;
	}
};

module.exports = NHLScore;