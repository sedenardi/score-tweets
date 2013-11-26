var NHLModel = require('./nhl_model.js')
,	http = require('http')
,	db = require('./db.js');

var league = Object.create(NHLModel);
var games = [];
var loopInterval;

var loop = function() {
	var rawResponse = '';
	var request = http.get(league.updateURL, function(res) {
		res.on('data', function(chunk) {
			rawResponse += chunk;
		});
		res.on('end', function() {
			games = league.getGameArray(rawResponse);
			console.log(league.leagueName + ': got ' + games.length + ' games');
		});
	}).on('error', function(e) {
		console.log('Error: ' + e.message);
	});
}

module.exports.league = league;

module.exports.startProcess = function(interval) {
	console.log(league.leagueName + ': starting process');
	db.connect(function() {
		console.log(league.leagueName + ': starting loop');
		loopInterval = setInterval(loop, interval);
		loop();
	});	
};

module.exports.endProcess = function() {
	console.log(league.leagueName + ': ending process');
	clearInterval(loopInterval);
	db.disconnect();
};