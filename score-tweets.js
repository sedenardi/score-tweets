var file = require('fs')
,	db = require('./my_modules/db.js')
,	config = require('./my_modules/config.js')
,	league = require('./my_modules/league.js')
,	NHL = require('./my_modules/nhl.js')
,	NFL = require('./my_modules/nfl.js');

var leagues = [];

/*var leagueNHL = Object.create(league);
leagueNHL.setLeague(NHL);
leagues.push(leagueNHL);*/

var leagueNFL = Object.create(league);
leagueNFL.setLeague(NFL);
leagues.push(leagueNFL);

for (var i = 0; i < leagues.length; i++) {
	leagues[i].startProcess();
}

var interval;
var end = function() {
	for (var i = 0; i < leagues.length; i++) {
		leagues[i].endProcess();
	}
	clearInterval(interval);
}

//interval = setInterval(end,25000);