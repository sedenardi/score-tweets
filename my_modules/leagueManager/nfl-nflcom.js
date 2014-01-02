var http = require('http'),
  moment = require('moment');

var NFL = function() {

  var self = this;
  var quarterArray = {
    1: '1st',
    2: '2nd',
    3: '3rd',
    4: '4th',
    5: 'OT'
  };

  this.leagueInfo = {
    leagueName: 'NFL',
    updateURL: 'http://www.nfl.com/liveupdate/scorestrip/ss.json',
    updateURL2: 'http://www.nfl.com/liveupdate/scorestrip/scorestrip.json'
  };

  this.getGameArray = function(next) {
    var rawOuter = '';
    var outerRequest = http.get(self.leagueInfo.updateURL, function outHttpSetup(oRes) {
      oRes.on('data', function outHttpData(chunk) {
        rawOuter += chunk;
      });
      oRes.on('end', function outHttpEnd() {
        var rawInner = '';
        var innerRequest = http.get(self.leagueInfo.updateURL2, function inHttpSetup(iRes) {
          iRes.on('data', function inHttpData(chunk) {
            rawInner += chunk;
          });
          iRes.on('end', function inHttpEnd() {
            try {
              rawInner = rawInner.replace(/\,\,/g,',"",')
                .replace(/\,\,/g,',"",');
              innerArray = JSON.parse(rawInner).ss;
              var innerObj = { };
              for (var i = 0; i < innerArray.length; i++) {
                innerObj[innerArray[i][10]] = innerArray[i];
              }
              var outerObj = JSON.parse(rawOuter);
              var gameArray = [];
              for (var i = 0; i < outerObj.gms.length; i++) {
                outerObj.gms[i].outer_w = outerObj.w;
                outerObj.gms[i].outer_t = outerObj.t;
                outerObj.gms[i].outer_y = outerObj.y;
                outerObj.gms[i].outer_gd = outerObj.gd;
                outerObj.gms[i].outer_bph = outerObj.bph;
                outerObj.gms[i].score_array = innerObj[outerObj.gms[i].gsis];
                gameArray.push(self.parseRawGame(outerObj.gms[i]));
              }
              next(null, gameArray);
            } catch(e) {
              console.log('NFL: parsing error');
              e.source = 'NFL';
              e.stack = e.stack + '\nOuter: ' + rawOuter + '\nInner: ' + rawInner;
              next(e); 
            }
          });
        }).on('error', function inHttpEnd(e) {
          console.log('NFL inner http Error: ' + e.message);
        });
      });
    }).on('error', function outHttpErrir(e) {
      console.log('NFL outer http Error: ' + e.message);
    });
  };

  this.parseRawGame = function(rawGame) {
    var game = { };
    var gameState = '';
    var timeString = rawGame.t;
    switch(rawGame.q) {
      case 'P':
        gameState = 'Scheduled';
        break;
      case 'H':
        gameState = 'Halftime';
        break;
      case 'F':
        gameState = 'Final';
        break;
      case 'FO':
        gameState = 'Final';
        break;
      case '5':
        gameState = 'Overtime';
        break;
      default:
        gameState = 'Progress';
        timeString = rawGame.score_array[3] ? rawGame.score_array[3] : '15:00';
        break;
    }
    var endIndex = rawGame.eid.toString().length - 2;
    var dateStr = rawGame.eid.toString().substr(0,endIndex);
    var gameDate = moment(dateStr ,'YYYYMD').toDate();
    game.GameSymbol = rawGame.eid.toString();
    game.State = gameState;
    game.Date = gameDate;
    game.SeasonYear = rawGame.outer_y;
    game.SeasonType = rawGame.outer_t;
    game.SeasonWeek = rawGame.outer_w;
    game.Time = timeString;
    game.Quarter = rawGame.q;
    game.AwayTeamDisplayName = rawGame.v;
    game.AwayTeamName = rawGame.vnn;
    game.AwayScore = rawGame.vs;
    game.HomeTeamDisplayName = rawGame.h;
    game.HomeTeamName = rawGame.hnn;
    game.HomeScore = rawGame.hs;
    game.RawInstance = JSON.stringify(rawGame,null,2);
    return game;
  };

  this.gameChanged = function(oldGame, newGame) {
    if (oldGame.GameSymbol === newGame.GameSymbol) {
      if (oldGame.State === 'Final' && newGame.State !== 'Final') {
        return false;
      }
      if (oldGame.State !== newGame.State) {
        return true;
      }
      if (oldGame.Quarter !== newGame.Quarter) {
        return true;
      }
      if (oldGame.AwayScore !== newGame.AwayScore ||
        oldGame.HomeScore !== newGame.HomeScore) {
        if ((oldGame.Quarter === newGame.Quarter && 
          oldGame.Time >= newGame.Time) ||
          oldGame.Quarter < newGame.Quarter) {
          return true;
        }
      }
    }
    return false;
    /*return (oldGame.GameSymbol === newGame.GameSymbol) &&
      ( (oldGame.State !== newGame.State) ||
        (oldGame.Quarter !== newGame.Quarter) ||
        ((oldGame.AwayScore !== newGame.AwayScore) ||
        (oldGame.HomeScore !== newGame.HomeScore) && 
        ((oldGame.Quarter === newGame.Quarter &&
          oldGame.Time > newGame.Time) ||
        oldGame.Quarter < newGame.Quarter)));*/
  };

  this.gameChangeString = function(oldGame, newGame) {
    var dif = [];
    if (oldGame.State !== newGame.State)
      dif.push(oldGame.State + '-' + newGame.State);
    if (oldGame.Quarter !== newGame.Quarter)
      dif.push(oldGame.Quarter + '-' + newGame.Quarter);
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
    if (oldGame.State !== newGame.State) {
      if (oldGame.State === 'Scheduled' && newGame.State === 'Progress') {
        tweet.TweetString = 'Start of game: ' +
          newGame.AwayTeamName + ' vs ' + newGame.HomeTeamName + ' ' +
          self.makeGameLink(newGame);
      }
     /* if (oldGame.State === 'Progress' && newGame.State === 'Halftime') {
        tweet.TweetString = 'Halftime. ' +
          scores + self.makeGameLink(newGame);
      }
      if (oldGame.State === 'Halftime' && newGame.State === 'Progress') {
        tweet.TweetString = 'Start of 3rd. ' +
          scores + self.makeGameLink(newGame);
      }
      if (oldGame.State === 'Progress' && newGame.State === 'Overtime') {
        tweet.TweetString = 'Headed to OT. ' +
          scores + self.makeGameLink(newGame);
      }*/
      if (newGame.State === 'Final') {
        if (oldGame.State === 'Overtime') {
          tweet.TweetString = 'Final OT. ' +
            scores + self.makeGameLink(newGame);
        } else {
          tweet.TweetString = 'Final. ' +
            scores + self.makeGameLink(newGame);
        }
      }
    /*} else if (oldGame.Quarter !== newGame.Quarter) {
        tweet.TweetString = 'Start of ' + quarterArray[newGame.Quarter] + '. ' +
          scores + self.makeGameLink(newGame);*/
    } else if ((oldGame.Quarter === newGame.Quarter 
      && oldGame.Time >= newGame.Time) ||
      (oldGame.Quarter < newGame.Quarter)) {
      if (oldGame.AwayScore > newGame.AwayScore ||
        oldGame.HomeScore > newGame.HomeScore) {
        tweet.TweetString = 'Score correction. ' +
          scores + newGame.Time + ' ' + 
          quarterArray[newGame.Quarter] + ' ' +
          self.makeGameLink(newGame);
      } else if (oldGame.AwayScore !== newGame.AwayScore) {
        tweet.TweetString = newGame.AwayTeamName + ' score. ' +
          scores + newGame.Time + ' ' + 
          quarterArray[newGame.Quarter] + ' ' +
          self.makeGameLink(newGame);
      } else if (oldGame.HomeScore !== newGame.HomeScore) {
        tweet.TweetString = newGame.HomeTeamName + ' score. ' +
          scores + newGame.Time + ' ' + 
          quarterArray[newGame.Quarter] + ' ' +
          self.makeGameLink(newGame);
      }
    }
    return tweet;
  };

  this.makeGameLink = function(game) {
    var link = 'http://www.nfl.com/gamecenter/' +
      game.GameSymbol + 
      '/' + 
      game.SeasonYear + 
      '/' + 
      game.SeasonType + 
      game.SeasonWeek + 
      '/' + 
      game.AwayTeamName + 
      '@' + 
      game.HomeTeamName;
    return link;
  };

  this.gameInProgress = function(game) {
    return game.State !== 'Scheduled' &&
      game.State !== 'Final';
  };

  this.insertGameQuery = function(game) {
    var stmnt = 
      'Insert into NFLGames(GameSymbol,Date,SeasonYear,SeasonType,\
        SeasonWeek,AwayTeamID,HomeTeamID)\
      Select\
        ?,?,?,?,?,away.TeamID,home.TeamID\
      from NFLTeams away\
        inner join NFLTeams home\
          on LOWER(REPLACE(home.Name,\' \',\'\')) like ?\
      where LOWER(REPLACE(away.Name,\' \',\'\')) like ?\
      and not exists\
        (Select 1 from NFLGames where GameSymbol like ?);';
    var params = [game.GameSymbol, game.Date, game.SeasonYear, game.SeasonType,
      game.SeasonWeek, game.HomeTeamName, game.AwayTeamName, game.GameSymbol];
    return {
      sql: stmnt,
      inserts: params
    };
  };

  this.insertGameInstanceQuery = function(game) {
    var stmnt = 
      'Insert into NFLGameInstances(GameID,StateID,Time,\
        Quarter,AwayScore,HomeScore,RawInstance)\
      Select\
        game.GameID,state.StateID,?,?,?,?,?\
      from NFLStates state\
        inner join NFLGames game\
          on game.GameSymbol like ?\
      where state.State = ?;';
    var params = [game.Time, game.Quarter, game.AwayScore,
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
      , game.SeasonYear\
      , game.SeasonType\
      , game.SeasonWeek\
      , instance.Time\
      , instance.Quarter\
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
      , instance.RecordedOn\
      from NFLGameInstances instance\
        inner join NFLGames game\
          on game.GameID = instance.GameID\
          and game.GameSymbol like ?\
        inner join NFLStates state\
          on state.StateID = instance.StateID\
        inner join NFLTeams away\
          on away.TeamID = game.AwayTeamID\
        inner join NFLTeams home\
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
      'Insert ignore into NFLTweets(InstanceID,TweetString)\
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
      from NFLTweets tweet\
        inner join NFLGameInstances instance\
          on instance.InstanceID = tweet.InstanceID\
      where tweet.TwitterID is null\
      and not exists\
        (select 1 from NFLGameInstances newerInstance\
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
    var stmnt = 'Update NFLTweets set TwitterID = ? where TweetID = ?;';
    var params = [TwitterID, TweetID];
    return {
      sql: stmnt,
      inserts: params
    };
  };

  this.ongoingGamesQuery = function() {
    var stmnt = 
      'Select\
        \'NFL\' as League\
      , instance.GameID\
      , instance.InstanceID\
      , (Select TwitterID\
        from NFLTweets tweet\
          inner join NFLGameInstances lastTweet\
            on lastTweet.InstanceID = tweet.InstanceID\
        where lastTweet.GameID = instance.GameID\
        and tweet.TwitterID REGEXP \'[0-9]+\'\
        order by tweet.RecordedOn desc limit 1) as LastTwitterID\
      , game.GameSymbol\
      , CONCAT(\'http://www.nfl.com/gamecenter/\',game.GameSymbol,\
        \'/\',game.SeasonYear,\'/\',game.SeasonType,\
        game.SeasonWeek,\'/\',away.Name,\
        \'@\',home.Name) as GameLink\
      , game.Date\
      , state.State\
      , game.SeasonYear\
      , game.SeasonType\
      , game.SeasonWeek\
      , instance.Time\
      , instance.Quarter\
      , away.City as AwayTeamCity\
      , away.Name as AwayTeamName\
      , away.DisplayName as AwayTeamDisplayName\
      , instance.AwayScore\
      , home.City as HomeTeamCity\
      , home.Name as HomeTeamName\
      , home.DisplayName as HomeTeamDisplayName\
      , instance.HomeScore\
      from NFLGameInstances instance\
        inner join NFLGames game\
          on game.GameID = instance.GameID\
        inner join NFLStates state\
          on state.StateID = instance.StateID\
        inner join NFLTeams away\
          on away.TeamID = game.AwayTeamID\
        inner join NFLTeams home\
          on home.TeamID = game.HomeTeamID\
      where state.State not like \'Scheduled\'\
      and state.State not like \'Final\'\
      and not exists\
        (Select 1 from NFLGameInstances newerInstance\
        where newerInstance.GameID = instance.GameID\
        and instance.RecordedOn < newerInstance.RecordedOn);';
    var params = [];
    return {
      sql: stmnt,
      inserts: params
    };
  };

  this.nextGameQuery = function() {
    var stmnt = 
      'Select\
        \'NFL\' as League\
      , instance.GameID\
      , instance.InstanceID\
      , game.GameSymbol\
      , CONCAT(\'http://www.nfl.com/gamecenter/\',game.GameSymbol,\
        \'/\',game.SeasonYear,\'/\',game.SeasonType,\
        game.SeasonWeek,\'/\',away.Name,\
        \'@\',home.Name) as GameLink\
      , game.Date\
      , STR_TO_DATE(CONCAT(DATE_FORMAT(game.Date,\'%Y-%m-%d\'),\' \',instance.Time,\' PM\'),\'%Y-%m-%d %h:%i %p\') as StartTime\
      , state.State\
      , game.SeasonYear\
      , game.SeasonType\
      , game.SeasonWeek\
      , instance.Time\
      , instance.Quarter\
      , away.City as AwayTeamCity\
      , away.Name as AwayTeamName\
      , away.DisplayName as AwayTeamDisplayName\
      , instance.AwayScore\
      , home.City as HomeTeamCity\
      , home.Name as HomeTeamName\
      , home.DisplayName as HomeTeamDisplayName\
      , instance.HomeScore\
      from NFLGameInstances instance\
        inner join NFLGames game\
          on game.GameID = instance.GameID\
        inner join NFLStates state\
          on state.StateID = instance.StateID\
        inner join NFLTeams away\
          on away.TeamID = game.AwayTeamID\
        inner join NFLTeams home\
          on home.TeamID = game.HomeTeamID\
      where state.State like \'Scheduled\'\
      and not exists\
        (Select 1 from NFLGameInstances newerInstance\
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
        \'NFL\' as League\
      , instance.GameID\
      , instance.InstanceID\
      , (Select TwitterID\
        from NFLTweets tweet\
          inner join NFLGameInstances lastTweet\
            on lastTweet.InstanceID = tweet.InstanceID\
        where lastTweet.GameID = instance.GameID\
        and tweet.TwitterID REGEXP \'[0-9]+\'\
        order by tweet.RecordedOn desc limit 1) as LastTwitterID\
      , game.GameSymbol\
      , CONCAT(\'http://www.nfl.com/gamecenter/\',game.GameSymbol,\
        \'/\',game.SeasonYear,\'/\',game.SeasonType,\
        game.SeasonWeek,\'/\',away.Name,\
        \'@\',home.Name) as GameLink\
      , game.Date\
      , state.State\
      , game.SeasonYear\
      , game.SeasonType\
      , game.SeasonWeek\
      , instance.Time\
      , instance.Quarter\
      , away.City as AwayTeamCity\
      , away.Name as AwayTeamName\
      , away.DisplayName as AwayTeamDisplayName\
      , instance.AwayScore\
      , home.City as HomeTeamCity\
      , home.Name as HomeTeamName\
      , home.DisplayName as HomeTeamDisplayName\
      , instance.HomeScore\
      from NFLGameInstances instance\
        inner join NFLGames game\
          on game.GameID = instance.GameID\
        inner join NFLStates state\
          on state.StateID = instance.StateID\
        inner join NFLTeams away\
          on away.TeamID = game.AwayTeamID\
        inner join NFLTeams home\
          on home.TeamID = game.HomeTeamID\
      where (instance.RecordedOn > DATE_SUB(NOW(),INTERVAL ? HOUR)\
        or state.State like \'Scheduled\')\
      and not exists\
        (Select 1 from NFLGameInstances newerInstance\
        where newerInstance.GameID = instance.GameID\
        and instance.RecordedOn < newerInstance.RecordedOn)\
      order by game.GameSymbol asc;';
    var params = [hoursAgo];
    return {
      sql: stmnt,
      inserts: params
    };
  };

  this.scheduledGamesQuery = function() {
    var stmnt = 
      'Select\
        \'NFL\' as League\
      , instance.GameID\
      , instance.InstanceID\
      , (Select TwitterID\
        from NFLTweets tweet\
          inner join NFLGameInstances lastTweet\
            on lastTweet.InstanceID = tweet.InstanceID\
        where lastTweet.GameID = instance.GameID\
        and tweet.TwitterID REGEXP \'[0-9]+\'\
        order by tweet.RecordedOn desc limit 1) as LastTwitterID\
      , game.GameSymbol\
      , CONCAT(\'http://www.nfl.com/gamecenter/\',game.GameSymbol,\
        \'/\',game.SeasonYear,\'/\',game.SeasonType,\
        game.SeasonWeek,\'/\',away.Name,\
        \'@\',home.Name) as GameLink\
      , game.Date\
      , state.State\
      , game.SeasonYear\
      , game.SeasonType\
      , game.SeasonWeek\
      , instance.Time\
      , instance.Quarter\
      , away.City as AwayTeamCity\
      , away.Name as AwayTeamName\
      , away.DisplayName as AwayTeamDisplayName\
      , instance.AwayScore\
      , home.City as HomeTeamCity\
      , home.Name as HomeTeamName\
      , home.DisplayName as HomeTeamDisplayName\
      , instance.HomeScore\
      from NFLGameInstances instance\
        inner join NFLGames game\
          on game.GameID = instance.GameID\
        inner join NFLStates state\
          on state.StateID = instance.StateID\
        inner join NFLTeams away\
          on away.TeamID = game.AwayTeamID\
        inner join NFLTeams home\
          on home.TeamID = game.HomeTeamID\
      where state.State like \'Scheduled\'\
      and not exists\
        (Select 1 from NFLGameInstances newerInstance\
        where newerInstance.GameID = instance.GameID\
        and instance.RecordedOn < newerInstance.RecordedOn)\
      order by game.GameSymbol asc;';
    var params = [];
    return {
      sql: stmnt,
      inserts: params
    };
  };
};

module.exports = new NFL();