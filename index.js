'use strict';

const runner = require('./runner');
const PGA = require('./leagues/pga');
const NHL = require('./leagues/nhl');
const MLB = require('./leagues/mlb');
const NFL = require('./leagues/nfl');
const api = require('./api');

module.exports = {
  pga: function(event, context) {
    const league = runner(PGA);
    league.web(context.done);
  },
  nhl: function(event, context) {
    const league = runner(NHL);
    league.web(context.done);
  },
  mlb: function(event, context) {
    const league = runner(MLB);
    league.web(context.done);
  },
  nfl: function(event, context) {
    const league = runner(NFL);
    league.web(context.done);
  },
  getFinalScore: function(event, context) {
    api.getFinalScore(event.query).then((res) => {
      context.done(null, res);
    }).catch((err) => {
      context.done(err);
    });
  }
};
