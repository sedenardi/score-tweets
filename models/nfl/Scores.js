'use strict';

const Game = require('./Game');
const _ = require('lodash');

class Scores {
  constructor(scores) {
    this.Games = scores.Games;
  }
  getScores() {
    return this.Games;
  }
  getGame(otherGame) {
    return _.find(this.Games, {GameSymbol: otherGame.GameSymbol});
  }
  getChanges(prev) {
    return _(this.Games)
      .map((g) => {
        const otherGame = prev.getGame(g);
        return otherGame ? g.scoreChange(otherGame) : null;
      })
      .filter((g) => { return g; })
      .map((g) => { return g.changeString(); })
      .filter((g) => { return g; })
      .value();
  }
}

Scores.parse = function(raw) {
  let json1;
  let json2;
  try {
    json1 = JSON.parse(raw[0]);
    json2 = JSON.parse(raw[1].replace(/\,\,/g, ',"",').replace(/\,\,/g, ',"",'));
  } catch(e) {
    return null;
  }
  const games = _.map(json1, (v, k) => {
    v.id = k;
    return Game.parse(v, json2.ss[0]);
  });
  return new Scores({Games: games});
};

module.exports = Scores;
