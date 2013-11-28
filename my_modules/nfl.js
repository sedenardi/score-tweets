var http = require('http');

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
					rawInner = rawInner.replace(/\,\,/g,',"",');
					rawInner = rawInner.replace(/\,\,/g,',"",');
					innerArray = JSON.parse(rawInner).ss;
					var innerObj = { };
					for (var i = 0; i < innerArray.length; i++) {
						innerObj[innerArray[i][10]] = innerArray[i];
					}
					outerObj = JSON.parse(rawOuter);
					for (var i = 0; i < outerObj.gms.length; i++) {
						outerObj.gms[i].outer_w = outerObj.w;
						outerObj.gms[i].outer_t = outerObj.t;
						outerObj.gms[i].outer_y = outerObj.y;
						outerObj.gms[i].outer_gd = outerObj.gd;
						outerObj.gms[i].outer_bph = outerObj.bph;
						outerObj.gms[i].score_array = innerObj[outerObj.gms[i].gsis];
					}
					next(outerObj.gms);
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
	var gameDate; //make date from rawGame data
	var gameState; //make state from rawGame
	this.GameID = rawGame.eid;
	this.state = gameState;
	this.date = gameDate;
	this.Year = rawGame.outer_y;
	this.SeasonType = '';
	this.Week = rawGame.outer_t + rawGame.outer_w;
	this.gameTime = rawGame.tsc;
	this.awayTeamCity = rawGame.v;
	this.awayTeamName = rawGame.vnn;
	this.awayScore = rawGame.vs;
	this.homeTeamCity = rawGame.h;
	this.homeTeamName = rawGame.hnn;
	this.homeScore = rawGame.hs;
};

var makeGameLink = function(game) {
	var link = 'http://www.nfl.com/gamecenter/' +
	game.GameID + '/' + game.Year + '/' + game.SeasonType + 
	game.Week + '/' + awayTeamName + '@' + homeTeamName;
	return link;
};

module.exports.leagueInfo = leagueInfo;
module.exports.getGameArray = getGameArray;
module.exports.parseRawGame = parseRawGame;
//module.exports.gameChanged = gameChanged;
//module.exports.gameChangeString = gameChangeString;
module.exports.makeGameLink = makeGameLink;
//module.exports.existsQuery = existsQuery;
//module.exports.insertGameQuery = insertGameQuery;
//module.exports.lastGameInstanceQuery = lastGameInstanceQuery;