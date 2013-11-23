var http = require('http');
var file = require('fs');
var NHLScore = require('./nhl.js');

var getData = function() {
	var rawResponse = '';
	var request = http.get(NHLScore.updateURL, function(res) {
		res.on('data', function(chunk) {
			//console.log('Got %d bytes of data', chunk.length);
			rawResponse += chunk;
		});
		res.on('end', function() {
			var array = NHLScore.getGameArray(rawResponse);
			toFile(array);
			//console.log('Response: ' + JSON.stringify(array));
		});
	}).on('error', function(e) {
		console.log('Error: ' + e.message);
	});

	var toFile = function(data){
		var s = JSON.stringify(data,null,2);
		var d = new Date(); 
		var dateString = d.getMonth().toString() + 
			d.getDate().toString() + 
			d.getFullYear().toString() + 
			d.getHours().toString() + 
			d.getMinutes().toString();
		var fileName = './tests/automated/nhl-' + dateString + '.json';
		file.writeFile(fileName, s, function(err) {
			if(err) {
				console.log(err);
			} else {
				console.log(fileName + ' save successfully.');
			}
		});
	};
};

var loop = setInterval(getData, 300000);
console.log('Created loop');