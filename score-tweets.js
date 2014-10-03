var fs = require('fs'),
  LeagueManager = require('./my_modules/leagueManager/leagueManager.js'),
  TwitGame = require('./my_modules/twitter/twitGame.js'),
  NHL = require('./my_modules/leagueManager/nhl-nhlcom.js'),
  MLB = require('./my_modules/leagueManager/mlb-mlbcom.js'),
  NFL = require('./my_modules/leagueManager/nfl-nflcom.js'),
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

var leagues = {},
  leagueManagers = {},
  twitters = {};

leagues.NHL = NHL;
leagueManagers.NHL = new LeagueManager(config, NHL);
twitters.NHL = new TwitGame(config, NHL);

leagues.MLB = MLB;
leagueManagers.MLB = new LeagueManager(config, MLB);
twitters.MLB = new TwitGame(config, MLB);

leagues.NFL = NFL;
leagueManagers.NFL = new LeagueManager(config, NFL);
twitters.NFL = new TwitGame(config, NFL);

var web = new Web(config, __dirname,leagues);

web.on('auth', function receiveAuth(data) {
  if (config.twitter.accounts[data.profile.username] !== 'undefined') {
    config.twitter.accounts[data.profile.username].access_token_key = data.token;
    config.twitter.accounts[data.profile.username].access_token_secret = data.tokenSecret;
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

var leagueChange = function(changeObj) {
  console.log('New tweet created from ' + changeObj.league.leagueInfo.leagueName);
  twitters[changeObj.league.leagueInfo.leagueName].tweet();
};

var leagueStatus = function(status) {
  web.updateLeagueStatus(status);
};

var twitStatus = function(status) {
  web.updateTwitStatus(status);
};

leagueManagers.NHL.on('change', leagueChange);
leagueManagers.NHL.on('status', leagueStatus);
leagueManagers.NHL.start();
//twitters.NHL.on('status', twitStatus);
twitters.NHL.start();

leagueManagers.MLB.on('change', leagueChange);
leagueManagers.MLB.on('status', leagueStatus);
leagueManagers.MLB.start();
twitters.MLB.on('status', twitStatus);
twitters.MLB.start();

leagueManagers.NFL.on('change', leagueChange);
leagueManagers.NFL.on('status', leagueStatus);
leagueManagers.NFL.start();
twitters.NFL.on('status', twitStatus);
twitters.NFL.start();

web.startServer();
