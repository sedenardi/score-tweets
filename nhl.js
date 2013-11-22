exports.updateURL = "http://live.nhle.com/GameData/RegularSeasonScoreboardv3.jsonp";

exports.makeGameInstance = function(rawGame) {
	var gameDate; //make date from rawGame data
	var gameState; //make state from rawGame
	return {
		gameId: rawGame.id,
		state: gameState,
		date: gameDate,
		gameTime: rawGame.tsc,
		awayTeam: rawGame.atn,
		awayScore: rawGame.ats,
		homeTeam: rawGame.htn,
		homeScore: rawGame.hts
	};
};

exports.makeGameLink = function(game) {
	var linkStub = "http://www.nhl.com/gamecenter/en/icetracker?id=";
	return linkStub + game.gameId;
};