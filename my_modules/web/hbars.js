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
        var statusLink = '<a href="/GetGameStatus?gameID=' + game.GameID + 
          '&league=' + game.League + '" target="_blank">';
        var status = '';
        var dayArray = {
          0: 'Sunday',
          1: 'Monday',
          2: 'Tuesday',
          3: 'Wednesday',
          4: 'Thursday',
          5: 'Friday',
          6: 'Saturday'
        };
        var numbers = {
          1: '1st',
          2: '2nd',
          3: '3rd',
          11: '11th',
          12: '12th',
          13: '13th'
        };
        var getNth = function(number) {
          var n = parseInt(number);
          var s = number.toString();
          if (typeof numbers[s] !== 'undefined') {
            return numbers[s];
          } else if (n % 10 === 1) {
            return s.substring(0, s.length - 1) + numbers['1'];
          } else if (n % 10 === 2) {
            return s.substring(0, s.length - 1) + numbers['2'];
          } else if (n % 10 === 3) {
            return s.substring(0, s.length - 1) + numbers['3'];
          } else {
            return s + 'th';
          }
        };
        if (game.League === 'NHL') {
          switch (game.State) {
            case 'Overtime':
            case 'Intermission':
            case 'Progress':
              status = statusLink + 'Last score - ' + game.Time + ' ' + game.Period + '</a>';
            case 'Shootout':
              status = statusLink + 'Shootout' + '</a>';
            case 'Final':
              if (game.Period) {
                status = statusLink + 'Final ' + game.Period + '</a>';
              } else {
                status = statusLink + 'Final' + '</a>';
              }
            case 'Scheduled':
              if (game.Date !== '0000-00-00'){
                if (game.Time) {
                  status = statusLink + dayArray[game.Date.getDay()] + ' ' + game.Time + '</a>';
                } else {
                  status = statusLink + dayArray[game.Date.getDay()] + '</a>';
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
                if (game.Time) {
                  return dayArray[game.Date.getDay()] + ' ' + game.Time;
                } else {
                  return dayArray[game.Date.getDay()];
                }
              }
          }
        } else if (game.League === 'MLB') {
          var topOrBottom = game.TopInning[0] === 1 ? 'Top' : 'Bottom';
          status = statusLink + topOrBottom + ' of ' + getNth(game.Inning) + ' - ' + 
            game.State + '</a>';
        } else {
          return game.State;
        }
        return new Handlebars.SafeString(status);
      },
      tableize: function(array) {
        if (!array.length) {
          return 'Empty array';
        }
        var table = '<div class="table-resposive">' + 
          '<table class="table table-striped table-bordered table-condensed">' + 
          '<thead><tr>';
        for (var key in array[0]) {
          if (key !== 'parse' && key !== '_typeCast') {
            table += '<th>' + key + '</th>';
          }
        }
        table += '</tr></thead><tbody>';
        for (var i = 0; i < array.length; i++) {
          table += '<tr>';
          for (var key in array[i]) {
            if (key !== 'parse' && key !== '_typeCast') {
              if (key === 'TopInning') {
                table += '<td>' + array[i][key][0] + '</td>';
              } else {
                table += '<td>' + array[i][key] + '</td>';
              }
            }
          }
          table += '</tr>';
        }
        table += '</tbody></table></div>';
        return new Handlebars.SafeString(table);
      }
    },
    layoutsDir: rootDir + config.web.folders.layouts,
    partialsDir: rootDir + config.web.folders.partials
  });
};

module.exports = exphbs;