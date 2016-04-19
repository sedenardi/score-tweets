'use strict';

var Game = require('./Game');
var _ = require('lodash');

var Scores = function(scores) {
  this.Games = _.map(scores.Games, function(p) { return new Game(p); });
};

Scores.parse = function(raw) {
  var games = _(raw)
    .map(function(res) {
      var json = null;
      try {
        json = JSON.parse(res);
      } catch(e) {
        return null;
      }
      if (!json.data || !json.data.games || !json.data.games.game) {
        return null;
      }
      return _.map(json.data.games.game, function(g) { return Game.parse(g); });
    })
    .flatten()
    .value();
  return new Scores({
    Games: games
  });
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