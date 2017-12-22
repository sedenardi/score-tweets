'use strict';

const Team = require('./Team');
const Instance = require('./Instance');
const _ = require('lodash');

const Game = function(game) {
  this.GameSymbol = game.GameSymbol;
  this.GameType = game.GameType;
  this.HomeTeam = game.HomeTeam ? new Team(game.HomeTeam) : null;
  this.AwayTeam = game.AwayTeam ? new Team(game.AwayTeam) : null;
  this.Instances = _.map(game.Instances, (i) => { return new Instance(i); });
};

Game.parse = function(raw) {
  const g = new Game({
    GameSymbol: raw.id,
    GameType: raw.game_type,
    HomeTeam: Team.parse(raw.home_team_id),
    AwayTeam: Team.parse(raw.away_team_id),
    Instances: [Instance.parse(raw)]
  });
  return g;
};

Game.prototype.scoreChange = function(prevGame) {
  const changed = this.Instances[0].scoreChanged(prevGame.Instances[0]);
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
  return 'http://www.mlb.com/r/game?gid=' + this.GameSymbol;
};

Game.prototype.changeString = function() {
  if (this.Instances.length !== 2) {
    return null;
  }
  return this.Instances[1].changeString(this.Instances[0], this);
};

module.exports = Game;
