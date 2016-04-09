'use strict';

var Player = require('./Player');
var _ = require('lodash');

var Scores = function(scores) {
  this.Timestamp = scores.Timestamp;
  this.Players = _.map(scores.Players, function(p) { return new Player(p); });
};

Scores.parse = function(raw) {
  return new Scores({
    Timestamp: parseInt(raw.time_stamp),
    Players: _.map(raw.leaderboard.players, function(p) { return Player.parse(p); })
  });
};

Scores.prototype.getPlayer = function(otherPlayer) {
  return _.find(this.Players, function(p) {
    return p.equals(otherPlayer);
  });
};

Scores.prototype.getChanges = function(prev) {
  return _(this.Players)
    .filter(function(p) { return p.positionNum() <= 10; })
    .map(function(p) {
      var otherPlayer = prev.getPlayer(p);
      if (!otherPlayer) {
        return null;
      }
      return p.scoreChange(otherPlayer);
    })
    .filter(function(p) { return p; })
    .map(function(p) { return p.changeString(); })
    .value();
};

module.exports = Scores;
