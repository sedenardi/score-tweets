var fs = require('fs'),
  LeagueManager = require('./my_modules/leagueManager/leagueManager.js'),
  TwitGame = require('./my_modules/twitter/twitGame.js'),
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

var leagues = {};
var twitters = {};

leagues.NHL = new LeagueManager(config, NHL);
twitters.NHL = new TwitGame(config, NHL);

leagues.NFL = new LeagueManager(config, NFL);
twitters.NFL = new TwitGame(config, NFL);

var web = new Web(config, __dirname);

web.on('auth', function receiveAuth(data) {
  for (var i = 0; i < config.twitter.accounts.length; i++) {
    if (config.twitter.accounts[i].username === data.profile.username) {
      config.twitter.accounts[i].access_token_key = data.token;
      config.twitter.accounts[i].access_token_secret = data.tokenSecret;
    }
  }
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
  console.log('New tweet created from ' + changeObj.league.leagueInfo.leagueName);
  twitters[changeObj.league.leagueInfo.leagueName].tweet();

};

leagues.NHL.on('change', processChange);
leagues.NFL.on('change', processChange);
leagues.NHL.start();
leagues.NFL.start();

twitters.NHL.start();
twitters.NFL.start();

web.startServer();