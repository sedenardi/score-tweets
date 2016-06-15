'use strict';

var Game = require('./Game');
var _ = require('lodash');

var Scores = function(scores) {
  this.Games = _.map(scores.Games, function(p) { return new Game(p); });
};

Scores.parse = function(raw) {
  raw = raw[0].trim().replace('loadScoreboard(', '');
  raw = raw.slice(0, -1);
  var json = null;
  try {
    json = JSON.parse(raw);
  } catch(e) {
    return null;
  }
  if (!json.games) {
    return null;
  }
  return new Scores({
    Games: _.map(json.games, function(g) { return Game.parse(g); })
  });
};

Scores.prototype.getScores = function() {
  return this.Games;
};

Scores.prototype.getGame = function(otherGame) {
  return _.find(this.Games, function(g) {
    return g.GameSymbol === otherGame.GameSymbol;
  });
};

Scores.prototype.getChanges = function(prev) {
  return _(this.Games)
    .map(function(g) {
      var otherGame = prev.getGame(g);
      if (!otherGame) {
        return null;
      }
      return g.scoreChange(otherGame);
    })
    .filter(function(g) { return g; })
    .map(function(g) { return g.changeString(); })
    .filter(function(g) { return g; })
    .value();
};

module.exports = Scores;
