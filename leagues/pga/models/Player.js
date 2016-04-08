'use strict';

var Hole = require('./Hole');
var _ = require('lodash');

var Player = function(player) {
  this.First = player.First;
  this.Last = player.Last;
  this.Holes = _.map(player.Holes, function(h) { return new Hole(h); });
};

Player.parse = function(raw) {
  return new Player({
    First: raw.player_bio.first_name,
    Last: raw.player_bio.last_name,
    Holes: _.map(raw.holes, function(h) { return Hole.parse(h); })
  });
};

Player.prototype.hash = function() {
  return this.First + this.Last;
};

Player.prototype.equals = function(otherPlayer) {
  return this.hash() === otherPlayer.hash();
};

Player.prototype.getHole = function(hole) {
  return _.find(this.Holes, {Hole: hole});
};

Player.prototype.getLatestHoleFinished = function() {
  var finished = _.filter(this.Holes, function(h) { return h.isFinished(); });
  return _.maxBy(finished, 'Hole');
};

Player.prototype.scoreChange = function(otherPlayer) {
  var latestHole = this.getLatestHoleFinished();
  if (latestHole) {
    var otherHole = otherPlayer.getHole(latestHole.Hole);
    var changed = latestHole.scoreChanged(otherHole);
    if (changed) {
      return new Player({
        First: this.First,
        Last: this.Last,
        Holes: [otherHole, latestHole]
      });
    }
  }
  return null;
};

Player.prototype.changeString = function() {
  if (this.Holes.length !== 2) {
    return null;
  }
  var score = this.Holes[1].scoreType();
  if (!score) {
    return null;
  }
  return this.First + ' ' + this.Last +
    ' shot ' + score +
    ' on ' + this.Holes[1].Hole.toString() +
    '. ' + this.Holes[1].PointsRound +
    ' today, ' + this.Holes[1].PointsEvent + ' overall.';    
};

module.exports = Player;
