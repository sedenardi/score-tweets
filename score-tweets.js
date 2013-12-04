var config = require('./my_modules/config.js'),
  db = require('./my_modules/db/db.js'),
  LeagueManager = require('./my_modules/leagueManager/leagueManager.js'),
  NHL = require('./my_modules/leagueManager/nhl.js'),
  NFL = require('./my_modules/leagueManager/nfl.js'),
  Web = require('./my_modules/web/web.js');

var leagues = [];

var leagueNHL = new LeagueManager(NHL);
leagues.push(leagueNHL);

var leagueNFL = new LeagueManager(NFL);
leagues.push(leagueNFL);

var web = new Web(__dirname);

web.on('auth', function receiveAuth(data) {
  console.log('Auth received for: ' + data.profile.username);
  console.log('token: ' + data.token);
  console.log('tokenSecret: ' + data.tokenSecret);
});

var processChange = function(changeObj) {
  console.log('Detected change from ' + changeObj.league.leagueInfo.leagueName);
};

for (var i = 0; i < leagues.length; i++) {
  leagues[i].startProcess();
  leagues[i].on('change', processChange);
}

web.startServer();