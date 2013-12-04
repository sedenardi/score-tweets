var file = require('fs'),
  db = require('./my_modules/db.js'),
  config = require('./my_modules/config.js'),
  LeagueManager = require('./my_modules/leagueManager.js').LeagueManager,
  NHL = require('./my_modules/nhl.js'),
  NFL = require('./my_modules/nfl.js'),
  Web = require('./my_modules/web.js');

var leagues = [];

var leagueNHL = new LeagueManager(NHL);
leagues.push(leagueNHL);

var leagueNFL = new LeagueManager(NFL);
leagues.push(leagueNFL);

for (var i = 0; i < leagues.length; i++) {
  //leagues[i].startProcess();
}

var web = new Web();