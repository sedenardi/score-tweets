exports.json = function(obj) {
  return JSON.stringify(obj, null, 2);
};

exports.state = function(game) {
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
        return game.Time + ' ' + game.Period;
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
        return game.Time + ' ' + quarterArray[game.Quarter];
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
};

exports.awayScore = function(game) {
  return game.State !== 'Scheduled' ? game.AwayScore : '';
};

exports.homeScore = function(game) {
  return game.State !== 'Scheduled' ? game.HomeScore : '';
};