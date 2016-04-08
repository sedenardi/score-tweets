'use strict';

var Hole = require('./Hole');
var _ = require('lodash');

var Player = function(player) {
  this.First = player.First;
  this.Last = player.Last;
  this.RoundTotal = player.RoundTotal;
  this.EventTotal = player.EventTotal;
  this.Position = player.Position;
  this.Holes = _.map(player.Holes, function(h) { return new Hole(h); });
};

Player.parse = function(raw) {
  return new Player({
    First: raw.player_bio.first_name,
    Last: raw.player_bio.last_name,
    RoundTotal: raw.today,
    EventTotal: raw.total,
    Position: raw.current_position,
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
        RoundTotal: this.RoundTotal,
        EventTotal: this.EventTotal,
        Position: this.Position,
        Holes: [otherHole, latestHole]
      });
    }
  }
  return null;
};

Player.prototype.positionNum = function() {
  if (isNaN(parseInt(this.Position.replace(/[^\d]/, '')))) {
    return -1;
  } else {
    return parseInt(this.Position.replace(/[^\d]/, ''));
  }
};

Player.prototype.ordinalPosition = function() {
  var str = '';
  var num = this.positionNum();
  if (num === -1) {
    return str;
  }
  var ones = num % 10;
  var teens = num % 100;
  if (ones === 1 && teens !== 11) {
    str = this.Position + 'st';
  } else if (ones === 2 && teens !== 12) {
    str = this.Position + 'nd';
  } else if (ones === 3 && teens !== 13) {
    str = this.Position + 'rd';
  } else {
    str = this.Position + 'th';
  }
  return str + ' place.';
};

Player.prototype.round = function() {
  return this.RoundTotal === 0 ? 'Even' :
    (this.RoundTotal > 0 ? ('+' + this.RoundTotal) : this.RoundTotal.toString());
};

Player.prototype.event = function() {
  return this.EventTotal === 0 ? 'even' :
    (this.EventTotal > 0 ? ('+' + this.EventTotal) : this.EventTotal.toString());
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
    ' on hole ' + this.Holes[1].Hole.toString() +
    '. ' + this.round() +
    ' today, ' + this.event() +
    ' overall. ' + this.ordinalPosition();
};

module.exports = Player;
