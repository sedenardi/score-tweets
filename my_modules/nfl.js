var NFLScore = {
	leagueName: 'NFL',
	updateURL: 'http://www.nfl.com/liveupdate/scorestrip/ss.json',
	updateURL2: 'http://www.nfl.com/liveupdate/scorestrip/scorestrip.json',
	getGameArray: function(rawData) {
		var s = JSON.parse(rawData);
		for (var i = 0; i < s.gms.length; i++) {
			s.gms[i].outer_w = s.w;
			s.gms[i].outer_t = s.t;
			s.gms[i].outer_y = s.y;
			s.gms[i].outer_gd = s.gd;
			s.gms[i].outer_bph = s.bph;
		}
		return s.gms;
	},
	parseRawGame: function(rawGame) {
		var gameDate; //make date from rawGame data
		var gameState; //make state from rawGame
		this.GameID = rawGame.eid;
		this.state = gameState;
		this.date = gameDate;
		this.Year = rawGame.outer_y;
		this.SeasonType = ;
		this.Week = rawGame.outer_t + rawGame.outer_w;
		this.gameTime = rawGame.tsc;
		this.awayTeamCity = rawGame.v;
		this.awayTeamName = rawGame.vnn;
		this.awayScore = rawGame.vs;
		this.homeTeamCity = rawGame.h;
		this.homeTeamName = rawGame.hnn;
		this.homeScore = rawGame.hs;
	},
	makeGameLink: function(game) {
		var link = 'http://www.nfl.com/gamecenter/' +
		game.GameID + '/' + game.Year + '/' + game.SeasonType + 
		game.Week + '/' + awayTeamName + '@' + homeTeamName;
		return link;
	}
};

module.exports = NFLScore;