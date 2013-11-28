var http = require('http')
,	file = require('fs')
,	NHLScore = require('./my_modules/nhl.js')
,	NFLScore = require('./my_modules/nfl.js');

//var league = Object.create(NHLScore);
var league = Object.create(NHLScore);

var getData = function() {
	var rawResponse = '';
	var request = http.get(league.updateURL, function(res) {
		res.on('data', function(chunk) {
			//console.log('Got %d bytes of data', chunk.length);
			rawResponse += chunk;
		});
		res.on('end', function() {
			var array = league.getGameArray(rawResponse);
			//toFile(array);
			console.log('Response: ' + JSON.stringify(array,null,2));
		});
	}).on('error', function(e) {
		console.log('Error: ' + e.message);
	});

	var toFile = function(data){
		var s = JSON.stringify(data,null,2);
		var d = new Date(); 
		var monthString = (d.getMonth() < 10 ? '0' : '') + d.getMonth().toString();
		var dayString = (d.getDate() < 10 ? '0' : '') + d.getDate().toString();
		var hourString = (d.getHours() < 10 ? '0' : '') + d.getHours().toString();
		var minuteString = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes().toString();
		var dateString = monthString + 
			dayString + 
			d.getFullYear().toString() + 
			hourString + 
			minuteString;
		var fileName = './tests/' + league.league + '-automated/' + 
			league.league + '-' + dateString + '.json';
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
getData();