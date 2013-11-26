var http = require('http')
,	file = require('fs')
,	NHLScore = require('./nhl.js')
,	NFLScore = require('./nfl.js');

var league = Object.create(NHLScore);

var rawResponse = '';
var request = http.get(league.updateURL, function(res) {
	res.on('data', function(chunk) {
		//console.log('Got %d bytes of data', chunk.length);
		rawResponse += chunk;
	});
	res.on('end', function() {
		var array = league.getGameArray(rawResponse);
		console.log('Response: ' + JSON.stringify(array));
	});
}).on('error', function(e) {
	console.log('Error: ' + e.message);
});