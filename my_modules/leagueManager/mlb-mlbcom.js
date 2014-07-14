var http = require('http'),
  moment = require('moment');

var MLB = function() {

  var self = this;

  this.leagueInfo = {
    leagueName: 'MLB',
    updateURL: function(yesterday) {
      var date = yesterday ? new moment().subtract('days',1) : new moment();
      var month = date.month() + 1;
      var day = date.date();
      var url = 'http://mlb.mlb.com/gdcross/components/game/mlb/year_' + 
        date.year() + 
        '/month_' + (month < 10 ? '0' : '') + month + 
        '/day_' + (day < 10 ? '0' : '') + day + 
        '/master_scoreboard.json';
      return url;
    }
  };

  this.getGameArray = function(next) {
    var t = this;
    var yesterdayRaw = '', todayRaw = '';
    var yRequest = http.get(t.leagueInfo.updateURL(true), function httpSetup(yRes) {
      yRes.on('data', function httpData(chunk) {
        yesterdayRaw += chunk;
      });
      yRes.on('end', function httpEnd() {
        var tRequest = http.get(t.leagueInfo.updateURL(false), function httpSetup(tRes) {
          tRes.on('data', function httpData(chunk) {
            todayRaw += chunk;
          });
          tRes.on('end', function httpEnd() {
            try {
              var rawYArray = JSON.parse(yesterdayRaw).data.games.game;
              var rawTArray = JSON.parse(todayRaw).data.games.game;
              var rawArray = rawYArray.concat(rawTArray);
              var gameArray = [];
              if (typeof rawTArray === 'undefined') {
                next(null, gameArray);
                return;
              }
              for (var i = 0; i < rawArray.length; i++) {
                var exists = false;
                for (var j = 0; j < gameArray.length; j++) {
                  exists = exists || gameArray[j] === rawArray[i].gameday;
                }
                if (!exists) {
                  gameArray.push(t.parseRawGame(rawArray[i]));
                }
              }
              next(null, gameArray);
            } catch(e) {
              console.log('MLB: Parse Error ' + e);
              e.source = 'MLB';
              next(e);
            }
          });
        }).on('error', function httpError(e) {
          console.log('MLB http Today Error: ' + e.message);
        });
      });
    }).on('error', function httpError(e) {
      console.log('MLB http Yesterday Error: ' + e.message);
    });
  };

  this.parseRawGame = function(rawGame) {
    var game = { };
    var awayScore = 0, homeScore = 0, inning = 0, topInning = 0;
    if (typeof rawGame.status.inning !== 'undefined' && rawGame.status.inning !== '')
      inning = parseInt(rawGame.status.inning);
    if (typeof rawGame.status.top_inning !== 'undefined')
      topInning = (rawGame.status.top_inning === 'Y') ? 1 : 0;
    if (typeof rawGame.linescore !== 'undefined') {
      awayScore = parseInt(rawGame.linescore.r.away);
      homeScore = parseInt(rawGame.linescore.r.home);
    }
    game.GameSymbol = rawGame.gameday;
    game.DateTime = moment(rawGame.time_date + ' PM');
    game.State = rawGame.status.status;
    game.Inning = inning;
    game.TopInning = topInning;
    game.AwayTeamID = rawGame.away_team_id;
    game.AwayTeamName = rawGame.away_team_name;
    game.HomeTeamID = rawGame.home_team_id;
    game.HomeTeamName = rawGame.home_team_name;
    game.AwayScore = awayScore;
    game.HomeScore = homeScore;
    game.RawInstance = JSON.stringify(rawGame,null,2);
    return game;
  };

  this.gameChanged = function(oldGame, newGame) {
    return (oldGame.GameSymbol === newGame.GameSymbol) &&
      ( (oldGame.State !== newGame.State) ||
        (oldGame.Inning !== newGame.Inning) ||
        (oldGame.TopInning[0] !== newGame.TopInning) ||
        (oldGame.AwayScore !== newGame.AwayScore) ||
        (oldGame.HomeScore !== newGame.HomeScore) );
  };

  this.gameChangeString = function(oldGame, newGame) {
    var dif = [];
    if (oldGame.State !== newGame.State)
      dif.push(oldGame.State + '-' + newGame.State);
    if (oldGame.Inning !== newGame.Inning)
      dif.push(oldGame.Inning + '-' + newGame.Inning);
    if (oldGame.TopInning[0] !== newGame.TopInning)
      dif.push(oldGame.TopInning[0] + '-' + newGame.TopInning);
    if (oldGame.AwayScore !== newGame.AwayScore)
      dif.push(oldGame.AwayScore + '-' + newGame.AwayScore);
    if (oldGame.HomeScore !== newGame.HomeScore)
      dif.push(oldGame.HomeScore + '-' + newGame.HomeScore);
    return dif.join(',');
  };

  this.gameChangeTweet = function(oldGame, newGame) {
    var tweet = {
      InstanceID: newGame.InstanceID,
      TweetString: ''
    };
    var scores = newGame.AwayTeamName + ' ' + newGame.AwayScore + ', ' +
      newGame.HomeTeamName + ' ' + newGame.HomeScore + ' ';
    if (newGame.State === 'In Progress' &&
      newGame.Inning === 1 && newGame.TopInning === 1 && 
      newGame.AwayScore === 0 && newGame.HomeScore === 0) {
      tweet.TweetString = 'Start of game: ' + 
        newGame.AwayTeamName + ' vs ' + newGame.HomeTeamName + ' ' +
        self.makeGameLink(newGame);
    } else if (newGame.State === 'Game Over' &&
      oldGame.State !== 'Game Over') {
      tweet.TweetString = 'Final' + 
        (newGame.Innings > 9 ? (' in ' + newGame.Innings + '.') : '.') + 
        ' ' + scores + ' ' + self.makeGameLink(newGame);
    } else if (oldGame.AwayScore === oldGame.HomeScore) {
      if (newGame.AwayScore > newGame.HomeScore) {
        tweet.TweetString = newGame.AwayTeamName + 
          ' take the lead, ' + scores + ' ' + 
          self.makeInningString(newGame) + ' ' + 
          self.makeGameLink(newGame);
      } else if (newGame.HomeScore > newGame.AwayScore){
        tweet.TweetString = newGame.HomeTeamName + 
          ' take the lead, ' + scores + ' ' + 
          self.makeInningString(newGame) + ' ' + 
          self.makeGameLink(newGame);
      }
    } else if (newGame.AwayScore === newGame.HomeScore) {
      if (oldGame.AwayScore < oldGame.HomeScore) {
        tweet.TweetString = newGame.AwayTeamName + 
          ' tie it up, ' + scores + ' ' + 
          self.makeInningString(newGame) + ' ' + 
          self.makeGameLink(newGame);
      } else if (oldGame.HomeScore < oldGame.AwayScore) {
        tweet.TweetString = newGame.HomeTeamName + 
          ' tie it up, ' + scores + ' ' + 
          self.makeInningString(newGame) + ' ' + 
          self.makeGameLink(newGame);
      }
    } else if (oldGame.AwayScore < oldGame.HomeScore && 
      newGame.HomeScore < newGame.AwayScore) {
      tweet.TweetString = newGame.AwayTeamName + 
        ' take the lead, ' + scores + ' ' + 
        self.makeInningString(newGame) + ' ' + 
        self.makeGameLink(newGame);
    } else if (oldGame.HomeScore < oldGame.AwayScore && 
      newGame.AwayScore < newGame.HomeScore) {
      tweet.TweetString = newGame.HomeTeamName + 
        ' take the lead, ' + scores + ' ' + 
        self.makeInningString(newGame) + ' ' + 
        self.makeGameLink(newGame);
    }
    return tweet;
  };

  this.getNth = function(number) {
    var numbers = {
      1: '1st',
      2: '2nd',
      3: '3rd',
      11: '11th',
      12: '12th',
      13: '13th'
    };
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

  this.makeInningString = function(game) {
    var topOrBottom = game.TopInning === 1 ? 'Top' : 'Bottom';
    return topOrBottom + ' ' + self.getNth(game.Inning);
  };

  this.makeGameLink = function(game) {
    var linkStub = 'http://www.mlb.com/r/game?gid=';
    return linkStub + game.GameSymbol;
  };

  this.insertGameQuery = function(game) {
    var stmnt = 
      'Insert into mlbgames(GameSymbol,DateTime,AwayTeamID, \
        HomeTeamID) \
      Select \
        ?,?,?,? from DUAL \
      where not exists\
        (Select 1 from mlbgames where GameSymbol like ?);';
    var params = [game.GameSymbol, game.DateTime.toDate(),
      game.AwayTeamID, game.HomeTeamID, game.GameSymbol];
    return {
      sql: stmnt,
      inserts: params
    };
  };

  this.insertGameInstanceQuery = function(game) {
    var stmnt = 
      'Insert into mlbgameinstances(GameID,State,Inning,\
        TopInning,AwayScore,HomeScore,RawInstance)\
      Select\
        game.GameID,?,?,?,?,?,?\
      from mlbgames game\
      where game.GameSymbol like ?;';
    var params = [game.State, game.Inning, game.TopInning, game.AwayScore,
      game.HomeScore, game.RawInstance, game.GameSymbol];
    return {
      sql: stmnt,
      inserts: params
    };
  };

  this.lastGameInstanceQuery = function(game) {
    var stmnt = 
      'Select\
        instance.InstanceID\
      , game.GameSymbol\
      , game.DateTime\
      , instance.State\
      , instance.Inning\
      , instance.TopInning\
      , game.AwayTeamID\
      , away.City as AwayTeamCity\
      , away.Name as AwayTeamName\
      , instance.AwayScore\
      , game.HomeTeamID\
      , home.City as HomeTeamCity\
      , home.Name as HomeTeamName\
      , instance.HomeScore\
      , instance.RecordedOn\
      from mlbgameinstances instance\
        inner join mlbgames game\
          on game.GameID = instance.GameID\
          and game.GameSymbol like ?\
        inner join mlbteams away\
          on away.TeamID = game.AwayTeamID\
        inner join mlbteams home\
          on home.TeamID = game.HomeTeamID\
      order by instance.RecordedOn desc limit 1;';
    var params = [game.GameSymbol];
    return {
      sql: stmnt,
      inserts: params
    };
  };

  this.insertGameChangeTweetQuery = function(tweet) {
    var stmnt = 
      'Insert ignore into mlbtweets(InstanceID,TweetString)\
      Select ?,?;';
    var params = [tweet.InstanceID, tweet.TweetString, tweet.InstanceID];
    return {
      sql: stmnt,
      inserts: params
    };
  };

  this.nextTweetQuery = function() {
    var stmnt = 
      'Select\
        tweet.TweetID\
      , tweet.TweetString\
      , tweet.RecordedOn\
      from mlbtweets tweet\
        inner join mlbgameinstances instance\
          on instance.InstanceID = tweet.InstanceID\
      where tweet.TwitterID is null\
      and not exists\
        (select 1 from mlbgameinstances newerInstance\
        where newerInstance.GameID = instance.GameID\
        and instance.RecordedOn < newerInstance.RecordedOn)\
      order by tweet.RecordedOn asc limit 1;';
    var params = [];
    return {
      sql: stmnt,
      inserts: params
    };
  };

  this.updateTweetQuery = function(TweetID, TwitterID) {
    var stmnt = 'Update mlbtweets set TwitterID = ? where TweetID = ?;';
    var params = [TwitterID, TweetID];
    return {
      sql: stmnt,
      inserts: params
    };
  };

  this.ongoingGamesQuery = function() {
    var stmnt = 
      'Select\
        \'MLB\' as League\
      , instance.GameID\
      , instance.InstanceID\
      , (Select TwitterID\
        from mlbtweets tweet\
          inner join mlbgameinstances lastTweet\
            on lastTweet.InstanceID = tweet.InstanceID\
        where lastTweet.GameID = instance.GameID\
        and tweet.TwitterID REGEXP \'[0-9]+\'\
        order by tweet.RecordedOn desc limit 1) as LastTwitterID\
      , game.GameSymbol\
      , CONCAT(?,game.GameSymbol) as GameLink\
      , game.DateTime\
      , instance.State\
      , instance.Inning\
      , instance.TopInning\
      , game.AwayTeamID\
      , away.City as AwayTeamCity\
      , away.Name as AwayTeamName\
      , instance.AwayScore\
      , game.HomeTeamID\
      , home.City as HomeTeamCity\
      , home.Name as HomeTeamName\
      , instance.HomeScore\
      from mlbgameinstances instance\
        inner join mlbgames game\
          on game.GameID = instance.GameID\
        inner join mlbteams away\
          on away.TeamID = game.AwayTeamID\
        inner join mlbteams home\
          on home.TeamID = game.HomeTeamID\
      where (instance.State like \'In Progress\'\
        or instance.State like \'Manager Challenge\'\
        or instance.State like \'Review\')\
      and instance.RecordedOn > DATE_SUB(NOW(),INTERVAL 24 HOUR)\
      and not exists\
        (Select 1 from mlbgameinstances newerInstance\
        where newerInstance.GameID = instance.GameID\
        and instance.RecordedOn < newerInstance.RecordedOn);';
    var params = ['http://www.mlb.com/r/game?gid='];
    return {
      sql: stmnt,
      inserts: params
    };
  };

  this.nextGameQuery = function() {
    var stmnt = 
      'Select\
        \'MLB\' as League\
      , instance.GameID\
      , instance.InstanceID\
      , game.GameSymbol\
      , game.DateTime\
      , game.DateTime as StartTime\
      , instance.State\
      , instance.Inning\
      , instance.TopInning\
      , game.AwayTeamID\
      , away.City as AwayTeamCity\
      , away.Name as AwayTeamName\
      , instance.AwayScore\
      , game.HomeTeamID\
      , home.City as HomeTeamCity\
      , home.Name as HomeTeamName\
      , instance.HomeScore\
      from mlbgameinstances instance\
        inner join mlbgames game\
          on game.GameID = instance.GameID\
        inner join mlbteams away\
          on away.TeamID = game.AwayTeamID\
        inner join mlbteams home\
          on home.TeamID = game.HomeTeamID\
      where (instance.State like \'Pre-Game\'\
      or instance.State like \'Preview\')\
      and game.DateTime >= NOW()\
      and not exists\
        (Select 1 from mlbgameinstances newerInstance\
        where newerInstance.GameID = instance.GameID\
        and instance.RecordedOn < newerInstance.RecordedOn)\
      order by StartTime asc limit 1;';
    var params = [];
    return {
      sql: stmnt,
      inserts: params
    };
  };

  this.latestGamesQuery = function(hoursAgo) {
    var stmnt = 
      'Select\
        \'MLB\' as League\
      , instance.GameID\
      , instance.InstanceID\
      , (Select TwitterID\
        from mlbtweets tweet\
          inner join mlbgameinstances lastTweet\
            on lastTweet.InstanceID = tweet.InstanceID\
        where lastTweet.GameID = instance.GameID\
        and tweet.TwitterID REGEXP \'[0-9]+\'\
        order by tweet.RecordedOn desc limit 1) as LastTwitterID\
      , game.GameSymbol\
      , CONCAT(?,game.GameSymbol) as GameLink\
      , game.DateTime\
      , instance.State\
      , instance.Inning\
      , instance.TopInning\
      , game.AwayTeamID\
      , away.City as AwayTeamCity\
      , away.Name as AwayTeamName\
      , instance.AwayScore\
      , game.HomeTeamID\
      , home.City as HomeTeamCity\
      , home.Name as HomeTeamName\
      , instance.HomeScore\
      from mlbgameinstances instance\
        inner join mlbgames game\
          on game.GameID = instance.GameID\
        inner join mlbteams away\
          on away.TeamID = game.AwayTeamID\
        inner join mlbteams home\
          on home.TeamID = game.HomeTeamID\
      where game.DateTime > DATE_SUB(NOW(),INTERVAL ? HOUR)\
      and not exists\
        (Select 1 from mlbgameinstances newerInstance\
        where newerInstance.GameID = instance.GameID\
        and instance.RecordedOn < newerInstance.RecordedOn)\
      order by game.DateTime asc;';
    var params = ['http://www.mlb.com/r/game?gid=',hoursAgo];
    return {
      sql: stmnt,
      inserts: params
    };
  };

  this.scheduledGamesQuery = function() {
    var stmnt = 
      'Select\
        \'MLB\' as League\
      , instance.GameID\
      , instance.InstanceID\
      , (Select TwitterID\
        from mlbtweets tweet\
          inner join mlbgameinstances lastTweet\
            on lastTweet.InstanceID = tweet.InstanceID\
        where lastTweet.GameID = instance.GameID\
        and tweet.TwitterID REGEXP \'[0-9]+\'\
        order by tweet.RecordedOn desc limit 1) as LastTwitterID\
      , game.GameSymbol\
      , CONCAT(?,game.GameSymbol) as GameLink\
      , game.DateTime\
      , instance.State\
      , instance.Inning\
      , instance.TopInning\
      , game.AwayTeamID\
      , away.City as AwayTeamCity\
      , away.Name as AwayTeamName\
      , instance.AwayScore\
      , game.HomeTeamID\
      , home.City as HomeTeamCity\
      , home.Name as HomeTeamName\
      , instance.HomeScore\
      from mlbgameinstances instance\
        inner join mlbgames game\
          on game.GameID = instance.GameID\
        inner join mlbteams away\
          on away.TeamID = game.AwayTeamID\
        inner join mlbteams home\
          on home.TeamID = game.HomeTeamID\
      where instance.State like \'Pre-Game\'\
      and not exists\
        (Select 1 from mlbgameinstances newerInstance\
        where newerInstance.GameID = instance.GameID\
        and instance.RecordedOn < newerInstance.RecordedOn)\
      order by game.DateTime asc;';
    var params = ['http://www.mlb.com/r/game?gid='];
    return {
      sql: stmnt,
      inserts: params
    };
  };

  this.gameStatusQuery = function(gameID) {
    var stmnt = 
      'Select\
        \'MLB\' as League\
      , instance.InstanceID\
      , instance.GameID\
      , instance.State\
      , instance.Inning\
      , instance.TopInning\
      , instance.AwayScore as \'Away\'\
      , instance.HomeScore as \'Home\'\
      , instance.RecordedOn\
      , tweets.TweetID\
      , tweets.TweetString\
      , tweets.RecordedOn as \'TweetRecordedOn\'\
      from mlbgameinstances instance\
        left join mlbtweets tweets\
          on tweets.InstanceID = instance.InstanceID\
      where instance.GameID = ?\
      order by instance.RecordedOn asc;';
    return {
      sql: stmnt,
      inserts: [gameID]
    };
  };
};

module.exports = new MLB();
