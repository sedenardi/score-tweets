'use strict';

const Team = require('./Team');
const Instance = require('./Instance');
const _ = require('lodash');

class Game {
  constructor(game) {
    this.GameSymbol = game.GameSymbol;
    this.HomeTeam = new Team(game.HomeTeam);
    this.AwayTeam = new Team(game.AwayTeam);
    this.Instances = _.map(game.Instances, (i) => { return new Instance(i); });
    this.Week = game.Week;
    this.Year = game.Year;
  }
  scoreChange(prevGame) {
    const changed = this.Instances[0].scoreChanged(prevGame.Instances[0]);
    if (changed) {
      return new Game({
        GameSymbol: this.GameSymbol,
        HomeTeam: this.HomeTeam,
        AwayTeam: this.AwayTeam,
        Instances: [prevGame.Instances[0], this.Instances[0]],
        Week: this.Week,
        Year: this.Year
      });
    }
  }
  makeGameLink() {
    return `http://www.nfl.com/gamecenter/${this.GameSymbol}/${this.Year}/${this.Week}/${this.AwayTeam.Name}@${this.HomeTeam.Name}`;
  }
  changeString() {
    if (this.Instances.length !== 2) {
      return null;
    }
    return this.Instances[1].changeString(this.Instances[0], this);
  }
}

Game.parse = function(raw, ss) {
  const game = {
    GameSymbol: raw.id,
    HomeTeam: Team.parse(raw.home.abbr),
    AwayTeam: Team.parse(raw.away.abbr),
    Instances: [Instance.parse(raw)]
  };
  if (ss) {
    game.Week = ss[12];
    game.Year = ss[13];
  }
  return new Game(game);
};

module.exports = Game;
