var http = require('http');
var NHLScore = require('./nhl.js');

var rawResponse = '';
var request = http.get(NHLScore.updateURL, function(res) {
	res.on('data', function(chunk) {
		console.log('Got %d bytes of data', chunk.length);
		rawResponse += chunk;
	});
	res.on('end', function() {
		var array = NHLScore.getGameArray(rawResponse);
		console.log('Response: ' + JSON.stringify(array));
	});
}).on('error', function(e) {
	console.log('Error: ' + e.message);
});