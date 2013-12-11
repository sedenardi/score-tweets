exports.json = function(obj) {
  return JSON.stringify(obj, null, 2);
};

exports.state = function(game) {
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
  }
};