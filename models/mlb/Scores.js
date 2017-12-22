'use strict';

const Game = require('./Game');
const _ = require('lodash');

const Scores = function(scores) {
  this.Games = _.map(scores.Games, (p) => { return new Game(p); });
};

Scores.parse = function(raw) {
  const games = _(raw)
    .map((res) => {
      let json = null;
      try {
        json = JSON.parse(res);
      } catch(e) {
        return null;
      }
      if (!json.data || !json.data.games || !json.data.games.game) {
        return [];
      }
      if (json.data.games.game.length === undefined) {
        return [Game.parse(json.data.games.game)];
      } else {
        return _.map(json.data.games.game, (g) => { return Game.parse(g); });
      }
    })
    .flatten()
    .filter((g) => {
      return g.GameType !== 'S' && g.GameType !== 'E' &&
        g.HomeTeam && g.AwayTeam;
    })
    .value();
  return new Scores({
    Games: games
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
