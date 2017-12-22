'use strict';

const ordinal = require('../../lib/ordinal');

const Instance = function(instance) {
  this.State = instance.State;
  this.Inning = instance.Inning;
  this.TopInning = instance.TopInning;
  this.HomeScore = instance.HomeScore;
  this.AwayScore = instance.AwayScore;
};

Instance.parse = function(raw) {
  const instObj = {
    State: raw.status.status,
    HomeScore: 0,
    AwayScore: 0,
    Inning: 0,
    TopInning: 0
  };
  if (raw.status.inning) {
    instObj.Inning = parseInt(raw.status.inning);
  }
  if (raw.status.top_inning) {
    instObj.TopInning = (raw.status.top_inning === 'Y');
  }
  if (raw.linescore) {
    instObj.HomeScore = parseInt(raw.linescore.r.home);
    instObj.AwayScore = parseInt(raw.linescore.r.away);
  }
  return new Instance(instObj);
};

Instance.prototype.scoreChanged = function(prevInstance) {
  return prevInstance.State !== this.State ||
    prevInstance.Inning !== this.Inning ||
    prevInstance.TopInning !== this.TopInning ||
    prevInstance.HomeScore !== this.HomeScore ||
    prevInstance.AwayScore !== this.AwayScore;
};

Instance.prototype.inningString = function() {
  const topOrBottom = this.TopInning ? 'Top' : 'Bottom';
  return topOrBottom + ' ' + ordinal(this.Inning) + ' inning.';
};

Instance.prototype.changeString = function(prevInstance, game) {
  let str = '';
  const scores = game.AwayTeam.Name + ' ' + this.AwayScore + ', ' +
    game.HomeTeam.Name + ' ' + this.HomeScore + '. ';

  let leadString = ' take the lead. ';
  if (this.Inning > prevInstance.Inning) {
    leadString = ' lead. ';
  }

  if (this.State === 'In Progress' &&
    this.Inning === 1 && this.TopInning === 1 &&
    this.AwayScore === 0 && this.HomeScore === 0) {
    str = 'Start of game: ' + game.AwayTeam.Name + ' vs ' + game.HomeTeam.Name;
  } else if ((this.State === 'Game Over' || this.State === 'Final') &&
    !(prevInstance.State === 'Game Over' || prevInstance.State === 'Final')) {
    str = 'Final' + (this.Inning > 9 ? (' in ' + this.Inning + '.') : '.') + ' ' + scores;
  } else if (prevInstance.AwayScore === prevInstance.HomeScore) {
    if (this.AwayScore > this.HomeScore) {
      str = game.AwayTeam.Name + leadString + scores + this.inningString();
    } else if (this.HomeScore > this.AwayScore){
      str = game.HomeTeam.Name + leadString + scores + this.inningString();
    }
  } else if (this.AwayScore === this.HomeScore) {
    if (this.Inning > prevInstance.Inning) {
      str = game.AwayTeam.Name + ' and ' + game.HomeTeam.Name + ' are tied, ' +
        scores + this.inningString();
    } else if (prevInstance.AwayScore < prevInstance.HomeScore) {
      str = game.AwayTeam.Name + ' tie it up, ' + scores + this.inningString();
    } else if (prevInstance.HomeScore < prevInstance.AwayScore) {
      str = game.HomeTeam.Name + ' tie it up, ' + scores + this.inningString();
    }
  } else if (prevInstance.AwayScore < prevInstance.HomeScore && this.HomeScore < this.AwayScore) {
    str = game.AwayTeam.Name + leadString + scores + this.inningString();
  } else if (prevInstance.HomeScore < prevInstance.AwayScore && this.AwayScore < this.HomeScore) {
    str = game.HomeTeam.Name + leadString + scores + this.inningString();
  }

  return str ? (str.trim() + ' ' + game.makeGameLink()) : '';
};

module.exports = Instance;
