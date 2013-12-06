var fs = require('fs'),
  db = require('./my_modules/db/db.js'),
  LeagueManager = require('./my_modules/leagueManager/leagueManager.js'),
  NHL = require('./my_modules/leagueManager/nhl.js'),
  NFL = require('./my_modules/leagueManager/nfl.js'),
  Web = require('./my_modules/web/web.js');

var configFile = './config.json';

var configData = fs.readFileSync(configFile),
  config;

try {
  config = JSON.parse(configData);
} catch (e) {
  console.log('Error parsing config.json, proper operation is highly unlikely');
  console.log(e);
}

var leagues = [];

var leagueNHL = new LeagueManager(config, NHL);
leagues.push(leagueNHL);

var leagueNFL = new LeagueManager(config, NFL);
leagues.push(leagueNFL);

var web = new Web(config, __dirname);

web.on('auth', function receiveAuth(data) {
  console.log('Auth received for: ' + data.profile.username);
  console.log('token: ' + data.token);
  console.log('tokenSecret: ' + data.tokenSecret);
  config.twitter.accounts[data.profile.username].access_token_key = data.token;
  config.twitter.accounts[data.profile.username].access_token_secret = data.tokenSecret;
  fs.writeFile(configFile, JSON.stringify(config,null,2), function(e) {
    if (e) {
      console.log('Error saving config file.');
      console.log(e);
      return;
    }
    console.log('Config saved successfully');
  });
});

var processChange = function(changeObj) {
  console.log('Detected change from ' + changeObj.league.leagueInfo.leagueName);
};

for (var i = 0; i < leagues.length; i++) {
  leagues[i].startProcess();
  leagues[i].on('change', processChange);
}

web.startServer();