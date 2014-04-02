var http = require('http'),
  moment = require('moment');

var MLB = function() {

  var self = this;

  this.leagueInfo = {
    leagueName: 'MLB',
    updateURL: function() {
      var date = new Date();
      var month = date.getMonth() + 1;
      var url = 'http://mlb.mlb.com/gdcross/components/game/mlb/year_' + 
        date.getFullYear() + 
        '/month_' + (month < 10 ? '0' : '') + month + 
        '/day_' + (date.getDate() < 10 ? '0' : '') + date.getDate() + 
        '/master_scoreboard.json';
      return url;
    }
  };

  this.getGameArray = function(next) {
    var rawData = '';
    var request = http.get(this.leagueInfo.updateURL(), function httpSetup(res) {
      res.on('data', function httpData(chunk) {
        rawData += chunk;
      });
      res.on('end', function httpEnd() {
        try {
          var rawArray = JSON.parse(rawData).data.games.game;
          var gameArray = [];
          for (var i = 0; i < rawArray.length; i++) {
            gameArray.push(self.parseRawGame(rawArray[i]));
          }
          next(null, gameArray);
        } catch(e) {
          console.log('MLB: Parse Error ' + e);
          e.source = 'MLB';
          next(e);
        }
      });
    }).on('error', function httpError(e) {
      console.log('MLB http Error: ' + e.message);
    });
  };

  this.parseRawGame = function(rawGame) {
    var game = { };
    var awayScore = 0, homeScore = 0, inning = 0, topInning = 0;
    if (typeof rawGame.status.inning !== 'undefined')
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
    game.HomeTeamID = rawGame.home_team_id;
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
    return tweet;
  };

  this.makeGameLink = function(game) {
    var linkStub = 'http://www.mlb.com/r/game?gid=';
    return linkStub + game.GameSymbol;
  };

  this.insertGameQuery = function(game) {
    var stmnt = 
      'Insert into MLBGames(GameSymbol,DateTime,AwayTeamID, \
        HomeTeamID) \
      Select \
        ?,?,?,? from DUAL \
      where not exists\
        (Select 1 from MLBGames where GameSymbol like ?);';
    var params = [game.GameSymbol, game.DateTime.toDate(),
      game.AwayTeamID, game.HomeTeamID, game.GameSymbol];
    return {
      sql: stmnt,
      inserts: params
    };
  };

  this.insertGameInstanceQuery = function(game) {
    var stmnt = 
      'Insert into MLBGameInstances(GameID,State,Inning,\
        TopInning,AwayScore,HomeScore,RawInstance)\
      Select\
        game.GameID,?,?,?,?,?,?\
      from MLBGames game\
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
      from MLBGameInstances instance\
        inner join MLBGames game\
          on game.GameID = instance.GameID\
          and game.GameSymbol like ?\
        inner join MLBTeams away\
          on away.TeamID = game.AwayTeamID\
        inner join MLBTeams home\
          on home.TeamID = game.HomeTeamID\
      order by instance.RecordedOn desc limit 1;';
    var params = [game.GameSymbol];
    return {
      sql: stmnt,
      inserts: params
    };
  };

  /*this.insertGameChangeTweetQuery = function(tweet) {
    var stmnt = 
      'Insert ignore into NHLTweets(InstanceID,TweetString)\
      Select ?,?;';
    var params = [tweet.InstanceID, tweet.TweetString, tweet.InstanceID];
    return {
      sql: stmnt,
      inserts: params
    };
  };*/

  /*this.nextTweetQuery = function() {
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
  };*/

  /*this.updateTweetQuery = function(TweetID, TwitterID) {
    var stmnt = 'Update NHLTweets set TwitterID = ? where TweetID = ?;';
    var params = [TwitterID, TweetID];
    return {
      sql: stmnt,
      inserts: params
    };
  };*/

  this.ongoingGamesQuery = function() {
    var stmnt = 
      'Select\
        \'MLB\' as League\
      , instance.GameID\
      , instance.InstanceID\
      , (Select TwitterID\
        from MLBTweets tweet\
          inner join MLBGameInstances lastTweet\
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
      from MLBGameInstances instance\
        inner join MLBGames game\
          on game.GameID = instance.GameID\
        inner join MLBTeams away\
          on away.TeamID = game.AwayTeamID\
        inner join MLBTeams home\
          on home.TeamID = game.HomeTeamID\
      where instance.State like \'In Progress\'\
      and not exists\
        (Select 1 from MLBGameInstances newerInstance\
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
      from MLBGameInstances instance\
        inner join MLBGames game\
          on game.GameID = instance.GameID\
        inner join MLBTeams away\
          on away.TeamID = game.AwayTeamID\
        inner join MLBTeams home\
          on home.TeamID = game.HomeTeamID\
      where instance.State like \'Pre-Game\'\
      or instance.State like \'Preview\'\
      and not exists\
        (Select 1 from MLBGameInstances newerInstance\
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
        from MLBTweets tweet\
          inner join MLBGameInstances lastTweet\
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
      from MLBGameInstances instance\
        inner join MLBGames game\
          on game.GameID = instance.GameID\
        inner join MLBTeams away\
          on away.TeamID = game.AwayTeamID\
        inner join MLBTeams home\
          on home.TeamID = game.HomeTeamID\
      where instance.RecordedOn > DATE_SUB(NOW(),INTERVAL ? HOUR)\
      and not exists\
        (Select 1 from MLBGameInstances newerInstance\
        where newerInstance.GameID = instance.GameID\
        and instance.RecordedOn < newerInstance.RecordedOn)\
      order by game.GameSymbol asc;';
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
        from MLBTweets tweet\
          inner join MLBGameInstances lastTweet\
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
      from MLBGameInstances instance\
        inner join MLBGames game\
          on game.GameID = instance.GameID\
        inner join MLBTeams away\
          on away.TeamID = game.AwayTeamID\
        inner join MLBTeams home\
          on home.TeamID = game.HomeTeamID\
      where instance.State like \'Pre-Game\'\
      and not exists\
        (Select 1 from MLBGameInstances newerInstance\
        where newerInstance.GameID = instance.GameID\
        and instance.RecordedOn < newerInstance.RecordedOn)\
      order by game.GameSymbol asc;';
    var params = ['http://www.mlb.com/r/game?gid='];
    return {
      sql: stmnt,
      inserts: params
    };
  };
};

module.exports = new MLB();