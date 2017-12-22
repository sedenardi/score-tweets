'use strict';

const Game = require('./Game');
const _ = require('lodash');

const Scores = function(scores) {
  this.Games = _.map(scores.Games, (p) => { return new Game(p); });
};

Scores.parse = function(raw) {
  raw = raw[0].trim().replace('loadScoreboard(', '');
  raw = raw.slice(0, -1);
  let json = null;
  try {
    json = JSON.parse(raw);
  } catch(e) {
    return null;
  }
  if (!json.games) {
    return null;
  }
  return new Scores({
    Games: _.map(json.games, (g) => { return Game.parse(g); })
  });
};

Scores.prototype.getScores = function() {
  return this.Games;
};

Scores.prototype.getGame = function(otherGame) {
  return _.find(this.Games, (g) => {
    return g.GameSymbol === otherGame.GameSymbol;
  });
};

Scores.prototype.getChanges = function(prev) {
  return _(this.Games)
    .map((g) => {
      const otherGame = prev.getGame(g);
      if (!otherGame) {
        return null;
      }
      return g.scoreChange(otherGame);
    })
    .filter((g) => { return g; })
    .map((g) => { return g.changeString(); })
    .filter((g) => { return g; })
    .value();
};

module.exports = Scores;
