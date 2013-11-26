var NHLModel = require('./nhl_model.js')
,	http = require('http')
,	db = require('./db.js');

var league = Object.create(NHLModel);
var loopInterval;

var loop = function() {
	var rawResponse = '';
	var request = http.get(league.updateURL, function(res) {
		res.on('data', function(chunk) {
			rawResponse += chunk;
		});
		res.on('end', function() {
			var games = league.getGameArray(rawResponse);
			console.log(league.leagueName + ': got ' + games.length + ' games');
			processArray(games);
		});
	}).on('error', function(e) {
		console.log('Error: ' + e.message);
	});
}

var processArray = function(games) {
	for (var i = 0; i < games.length; i++) {
		console.log(league.leagueName + ': processing ' + games[i].GameID);
		(function process(game){
			db.exists('Select 1 from NHLChanges where GameID = ?', [game.GameID], function (res) {
				if (res.exists) {
					console.log(league.leagueName + ': ' + game.GameID + ' does exist');
				} else {
					console.log(league.leagueName + ': ' + game.GameID + ' does not exist');
				}
			});
		}(games[i]));
	}
}

/***** EXPORTS *****/
module.exports.league = league;

module.exports.startProcess = function(interval) {
	console.log(league.leagueName + ': starting process');
	db.connect(function() {
		loopInterval = setInterval(loop, interval);
		loop();
	});	
};

module.exports.endProcess = function() {
	console.log(league.leagueName + ': ending process');
	clearInterval(loopInterval);
	db.disconnect();
};