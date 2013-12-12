var expressHandlebars  = require('express3-handlebars'),
  Handlebars = require('handlebars');

var exphbs = function(rootDir, config) {
  this.hbs = expressHandlebars.create({
    defaultLayout: 'main',
    handlebars: Handlebars,
    helpers: {
      json: function(obj) {
        return JSON.stringify(obj, null, 2);
      },
      awayScore: function(game) {
        return game.State !== 'Scheduled' ? game.AwayScore : '';
      },
      homeScore: function(game) {
        return game.State !== 'Scheduled' ? game.HomeScore : '';
      },
      info: function(game) {
        var extSpan = '<span class="gameLink"><a href="' + game.GameLink + '" target="_blank" title="View game on league\'s site">' +
          '<i class="fa fa-external-link"></i> Open Game</a></span>';
        var tweetSpan = '<span class="gameTweet"></span>';
        if (game.LastTwitterID) {
          var userName = config.leagues[game.League].twitterUser;
          var tweetURL = 'https://twitter.com/' + userName + '/status/' + game.LastTwitterID;
          var tweetLink = '<a href="' + tweetURL + '" target="_blank" title="Open last tweet related to game">' +
            '<i class="fa fa-twitter"></i> Last Tweet</a>';
          tweetSpan = '<span class="gameTweet">' + tweetLink + '</span>';
        }
        return new Handlebars.SafeString(extSpan + tweetSpan);
      },
      state: function(game) {
        var dayArray = {
          0: 'Sunday',
          1: 'Monday',
          2: 'Tuesday',
          3: 'Wednesday',
          4: 'Thursday',
          5: 'Friday',
          6: 'Saturday'
        };
        if (game.League === 'NHL') {
          switch (game.State) {
            case 'Overtime':
            case 'Intermission':
            case 'Progress':
              return 'Last score - ' + game.Time + ' ' + game.Period;
            case 'Shootout':
              return 'Shootout';
            case 'Final':
              if (game.Period) {
                return 'Final ' + game.Period;
              } else {
                return 'Final';
              }
            case 'Scheduled':
              if (game.Date !== '0000-00-00'){
                if (game.StartTime) {
                  return dayArray[game.Date.getDay()] + ' ' + game.StartTime;
                } else {
                  return dayArray[game.Date.getDay()];
                }
              }
          }
        } else if (game.League === 'NFL') {
          var quarterArray = {
            1: '1st',
            2: '2nd',
            3: '3rd',
            4: '4th',
            5: 'OT'
          };
          switch (game.State) {
            case 'Overtime':
              return game.Time + ' Overtime';
            case 'Halftime':
              return 'Halftime';
            case 'Progress':
              return 'Last score - ' + game.Time + ' ' + quarterArray[game.Quarter];
            case 'Final':
              return 'Final';
            case 'Scheduled':
              if (game.Date !== '0000-00-00'){
                if (game.StartTime) {
                  return dayArray[game.Date.getDay()] + ' ' + game.StartTime;
                } else {
                  return dayArray[game.Date.getDay()];
                }
              }
          }
        } else {
          return game.State;
        }
      }
    },
    layoutsDir: rootDir + config.web.folders.layouts,
    partialsDir: rootDir + config.web.folders.partials
  });
};

module.exports = exphbs;