var http = require('http');

var NHL = function() {

  var self = this;

  this.leagueInfo = {
    leagueName: 'NHL',
    updateURL: 'http://live.nhle.com/GameData/RegularSeasonScoreboardv3.jsonp'
  };

  this.getGameArray = function(next) {
    var rawData = '';
    var request = http.get(this.leagueInfo.updateURL, function httpSetup(res) {
      res.on('data', function httpData(chunk) {
        rawData += chunk;
      });
      res.on('end', function httpEnd() {
        try {
          rawData = rawData.replace('loadScoreboard(','');
          rawData = rawData.substring(0,(rawData.length-2));
          var rawArray = JSON.parse(rawData).games;
          var gameArray = [];
          for (var i = 0; i < rawArray.length; i++) {
            gameArray.push(self.parseRawGame(rawArray[i]));
          }
          next(null, gameArray);
        } catch(e) {
          console.log('NHL: Parse Error ' + e);
          e.source = 'NHL';
          next(e);
        }
      });
    }).on('error', function httpError(e) {
      console.log('NHL http Error: ' + e.message);
    });
  };

  this.parseRawGame = function(rawGame) {
    var game = { };
    var date = new Date();
    var gameState = '';
    var timeString = '';
    var periodString = '';
    switch (rawGame.gs) {
      case '1':
        gameState = 'Scheduled';
        var arr = rawGame.ts.split(' ');
        var dateArr = arr[arr.length-1].split('/');
        date.setMonth(parseInt(dateArr[0])-1);
        date.setDate(parseInt(dateArr[1]));
        timeString = rawGame.bs;
        break;
      case '2':
        gameState = 'Scheduled';
        break;
      case '3':
        if (rawGame.ts.indexOf('END') !== -1) {
          gameState = 'Intermission';
        } else {
          gameState = 'Progress';
        }
        timeString = rawGame.ts.split(' ')[0];
        periodString = rawGame.ts.split(' ')[1];
        break;
      case '4':
        if (rawGame.ts.indexOf('SHOOTOUT') !== -1) {
          gameState = 'Shootout';
        } else {
          timeString = rawGame.ts.split(' ')[0];
          periodString = rawGame.ts.split(' ')[1];
          if (periodString === 'OT') {
            gameState = 'Overtime';
          } else if (periodString === 'SO') {
            gameState = 'Shootout';
          } else {
            gameState = 'Progress';
          }
        }
        break;
      case '5':
        gameState = 'Final';
        var arr = rawGame.ts.split(' ');
        var dateArr = arr[arr.length-1].split('/');
        date.setMonth(parseInt(dateArr[0])-1);
        date.setDate(parseInt(dateArr[1]));
        break;
    }
    game.GameSymbol = rawGame.id;
    game.Date = date;
    game.State = gameState;
    game.Time = timeString;
    game.Period = periodString;
    game.AwayTeamCity = rawGame.atn;
    game.AwayTeamName = rawGame.atv;
    game.AwayScore = (rawGame.ats === '' ? 0 : parseInt(rawGame.ats));
    game.HomeTeamCity = rawGame.htn;
    game.HomeTeamName = rawGame.htv;
    game.HomeScore = (rawGame.hts === '' ? 0 : parseInt(rawGame.hts));
    game.RawInstance = JSON.stringify(rawGame,null,2);
    return game;
  };

  this.gameChanged = function(oldGame, newGame) {
    return (oldGame.GameSymbol === newGame.GameSymbol) &&
      ( (oldGame.State !== newGame.State) ||
        (oldGame.Period !== newGame.Period) ||
        (oldGame.AwayScore !== newGame.AwayScore) ||
        (oldGame.HomeScore !== newGame.HomeScore));
  };

  this.gameChangeString = function(oldGame, newGame) {
    var dif = [];
    if (oldGame.State !== newGame.State)
      dif.push(oldGame.State + '-' + newGame.State);
    if (oldGame.Period !== newGame.Period)
      dif.push(oldGame.Period + '-' + newGame.Period);
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
    var scores = oldGame.AwayTeamName + ' ' + newGame.AwayScore + ', ' +
      oldGame.HomeTeamName + ' ' + newGame.HomeScore + ' ';
    if (oldGame.State !== newGame.State) {
      if (oldGame.State === 'Scheduled' && newGame.State === 'Progress') {
        tweet.TweetString = 'Start of game: ' +
          oldGame.AwayTeamName + ' vs ' + oldGame.HomeTeamName + ' ' +
          self.makeGameLink(newGame);
      }
      /*if (oldGame.State === 'Progress' && newGame.State === 'Intermission') {
        tweet.TweetString = 'End of ' + newGame.Period + '. ' +
          scores + self.makeGameLink(newGame);
      }
      if (oldGame.State === 'Intermission' && newGame.State === 'Progress') {
        tweet.TweetString = 'Start of ' + newGame.Period + '. ' +
          scores + self.makeGameLink(newGame);
      }
      if (oldGame.State === 'Progress' && newGame.State === 'Overtime') {
        tweet.TweetString = 'Headed to OT. ' +
          scores + self.makeGameLink(newGame);
      }
      if (oldGame.State === 'Overtime' && newGame.State === 'Shootout') {
        tweet.TweetString = 'Headed to a shootout. ' +
          scores + self.makeGameLink(newGame);
      }*/
      if (newGame.State === 'Final') {
        if (oldGame.State === 'Shootout') {
          tweet.TweetString = 'Final SO. ' +
            scores + self.makeGameLink(newGame);
        } else if (oldGame.State === 'Overtime') {
          tweet.TweetString = 'Final OT. ' +
            scores + self.makeGameLink(newGame);
        } else {
          tweet.TweetString = 'Final. ' +
            scores + self.makeGameLink(newGame);
        }      
      }
    } else {
      if (oldGame.AwayScore !== newGame.AwayScore) {
        tweet.TweetString = oldGame.AwayTeamName + ' score. ' +
          scores + newGame.Time + ' ' + newGame.Period + ' ' +
          self.makeGameLink(newGame);
      }
      if (oldGame.HomeScore !== newGame.HomeScore) {
        tweet.TweetString = oldGame.HomeTeamName + ' score. ' +
          scores + newGame.Time + ' ' + newGame.Period + ' ' +
          self.makeGameLink(newGame);
      }
    }
    return tweet;
  };

  this.makeGameLink = function(game) {
    var linkStub = 'http://www.nhl.com/gamecenter/en/icetracker?id=';
    return linkStub + game.GameSymbol;
  };

  this.insertGameQuery = function(game) {
    var stmnt = 
      'Insert into NHLGames(GameSymbol,Date,AwayTeamID,\
        HomeTeamID)\
      Select\
        ?,?,away.TeamID,home.TeamID\
      from NHLTeams away\
        inner join NHLTeams home\
          on LOWER(REPLACE(home.Name,\' \',\'\')) like ?\
      where LOWER(REPLACE(away.Name,\' \',\'\')) like ?\
      and not exists\
        (Select 1 from NHLGames where GameSymbol like ?);';
    var params = [game.GameSymbol, game.Date,
      game.HomeTeamName, game.AwayTeamName, game.GameSymbol];
    return {
      sql: stmnt,
      inserts: params
    };
  };

  this.insertGameInstanceQuery = function(game) {
    var stmnt = 
      'Insert into NHLGameInstances(GameID,StateID,Time,\
        Period,AwayScore,HomeScore,RawInstance)\
      Select\
        game.GameID,state.StateID,?,?,?,?,?\
      from NHLStates state\
        inner join NHLGames game\
          on game.GameSymbol like ?\
      where state.State = ?;';
    var params = [game.Time, game.Period, game.AwayScore,
      game.HomeScore, game.RawInstance, game.GameSymbol, game.State];
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
      , game.Date\
      , state.State\
      , instance.Time\
      , instance.Period\
      , away.City as AwayTeamCity\
      , away.Name as AwayTeamName\
      , away.DisplayName as AwayTeamDisplayName\
      , away.TwitterAccount as AwayTwitterAccount\
      , away.TwitterHashtag as AwayTwitterHashtag\
      , instance.AwayScore\
      , home.City as HomeTeamCity\
      , home.Name as HomeTeamName\
      , home.DisplayName as HomeTeamDisplayName\
      , home.TwitterAccount as HomeTwitterAccount\
      , home.TwitterHashtag as HomeTwitterHashtag\
      , instance.HomeScore\
      from NHLGameInstances instance\
        inner join NHLGames game\
          on game.GameID = instance.GameID\
          and game.GameSymbol like ?\
        inner join NHLStates state\
          on state.StateID = instance.StateID\
        inner join NHLTeams away\
          on away.TeamID = game.AwayTeamID\
        inner join NHLTeams home\
          on home.TeamID = game.HomeTeamID\
      order by ?? desc limit 1;';
    var params = [game.GameSymbol, 'instance.RecordedOn'];
    return {
      sql: stmnt,
      inserts: params
    };
  };

  this.insertGameChangeTweetQuery = function(tweet) {
    var stmnt = 
      'Insert ignore into NHLTweets(InstanceID,TweetString)\
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
      from NHLTweets tweet\
        inner join NHLGameInstances instance\
          on instance.InstanceID = tweet.InstanceID\
      where tweet.TwitterID is null\
      and not exists\
        (select 1 from NHLGameInstances newerInstance\
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
    var stmnt = 'Update NHLTweets set TwitterID = ? where TweetID = ?;';
    var params = [TwitterID, TweetID];
    return {
      sql: stmnt,
      inserts: params
    };
  };

  this.latestGamesQuery = function(hoursAgo) {
    var stmnt = 
      'Select\
        instance.GameID\
      , instance.InstanceID\
      , (Select TwitterID\
        from NHLTweets tweet\
          inner join NHLGameInstances lastTweet\
            on lastTweet.InstanceID = tweet.InstanceID\
        where lastTweet.GameID = instance.GameID\
        and tweet.TwitterID REGEXP \'[0-9]+\'\
        order by tweet.RecordedOn desc limit 1) as LastTwitterID\
      , game.GameSymbol\
      , game.Date\
      , state.State\
      , instance.Time\
      , instance.Period\
      , away.City as AwayTeamCity\
      , away.Name as AwayTeamName\
      , away.DisplayName as AwayTeamDisplayName\
      , instance.AwayScore\
      , home.City as HomeTeamCity\
      , home.Name as HomeTeamName\
      , home.DisplayName as HomeTeamDisplayName\
      , instance.HomeScore\
      from NHLGameInstances instance\
        inner join NHLGames game\
          on game.GameID = instance.GameID\
        inner join NHLStates state\
          on state.StateID = instance.StateID\
        inner join NHLTeams away\
          on away.TeamID = game.AwayTeamID\
        inner join NHLTeams home\
          on home.TeamID = game.HomeTeamID\
      where instance.RecordedOn > DATE_SUB(NOW(),INTERVAL ? HOUR)\
      and not exists\
        (Select 1 from NHLGameInstances newerInstance\
        where newerInstance.GameID = instance.GameID\
        and instance.RecordedOn < newerInstance.RecordedOn);';
    var params = [hoursAgo];
    return {
      sql: stmnt,
      inserts: params
    };
  };

  this.scheduledGamesQuery = function() {
    var stmnt = 
      'Select\
        instance.GameID\
      , instance.InstanceID\
      , (Select TwitterID\
        from NHLTweets tweet\
          inner join NHLGameInstances lastTweet\
            on lastTweet.InstanceID = tweet.InstanceID\
        where lastTweet.GameID = instance.GameID\
        and tweet.TwitterID REGEXP \'[0-9]+\'\
        order by tweet.RecordedOn desc limit 1) as LastTwitterID\
      , game.GameSymbol\
      , game.Date\
      , state.State\
      , instance.Time\
      , instance.Period\
      , away.City as AwayTeamCity\
      , away.Name as AwayTeamName\
      , away.DisplayName as AwayTeamDisplayName\
      , instance.AwayScore\
      , home.City as HomeTeamCity\
      , home.Name as HomeTeamName\
      , home.DisplayName as HomeTeamDisplayName\
      , instance.HomeScore\
      from NHLGameInstances instance\
        inner join NHLGames game\
          on game.GameID = instance.GameID\
        inner join NHLStates state\
          on state.StateID = instance.StateID\
        inner join NHLTeams away\
          on away.TeamID = game.AwayTeamID\
        inner join NHLTeams home\
          on home.TeamID = game.HomeTeamID\
      where state.State like \'Scheduled\'\
      and not exists\
        (Select 1 from NHLGameInstances newerInstance\
        where newerInstance.GameID = instance.GameID\
        and instance.RecordedOn < newerInstance.RecordedOn);';
    var params = [];
    return {
      sql: stmnt,
      inserts: params
    };
  };
};

module.exports = new NHL();