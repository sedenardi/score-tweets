'use strict';

var Team = require('./Team');
var Instance = require('./Instance');
var _ = require('lodash');

var Game = function(game) {
  this.GameSymbol = game.GameSymbol;
  this.HomeTeam = new Team(game.HomeTeam);
  this.AwayTeam = new Team(game.AwayTeam);
  this.Instances = _.map(game.Instances, function(i) { return new Instance(i); });
};

Game.parse = function(raw) {
  return new Game({
    GameSymbol: raw.id,
    HomeTeam: Team.parse(raw.htv),
    AwayTeam: Team.parse(raw.atv),
    Instances: [Instance.parse(raw)]
  });
};

Game.prototype.scoreChange = function(prevGame) {
  var changed = this.Instances[0].scoreChanged(prevGame.Instances[0]);
  if (changed) {
    return new Game({
      GameSymbol: this.GameSymbol,
      HomeTeam: new Team(this.HomeTeam),
      AwayTeam: new Team(this.AwayTeam),
      Instances: [prevGame.Instances[0], this.Instances[0]]
    });
  }
};

Game.prototype.makeGameLink = function() {
  return 'http://www.nhl.com/gamecenter/en/icetracker?id=' + this.GameSymbol;
};

Game.prototype.changeString = function() {
  if (this.Instances.length !== 2) {
    return null;
  }
  return this.Instances[1].changeString(this.Instances[0], this);
};

module.exports = Game;
