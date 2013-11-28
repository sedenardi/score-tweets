var file = require('fs')
,	db = require('./my_modules/db.js')
,	config = require('./my_modules/config.js')
,	NHL = require('./my_modules/nhl.js');

var leagues = [];
leagues.push(NHL);

for (var i = 0; i < leagues.length; i++) {
	var leagueName = leagues[0].league.leagueInfo.leagueName;
	leagues[i].startProcess(config.leagues[leagueName].refreshInterval);
}

var interval;
var end = function() {
	for (var i = 0; i < leagues.length; i++) {
		leagues[i].endProcess();
	}
	clearInterval(interval);
}

//interval = setInterval(end,25000);