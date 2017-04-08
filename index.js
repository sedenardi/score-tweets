'use strict';

var runner = require('./runner');
var PGA = require('./leagues/pga');
var NHL = require('./leagues/nhl');
var MLB = require('./leagues/mlb');
var NFL = require('./leagues/nfl');
const api = require('./api');

module.exports = {
  pga: function(event, context) {
    var league = runner(PGA);
    league.web(context.done);
  },
  nhl: function(event, context) {
    var league = runner(NHL);
    league.web(context.done);
  },
  mlb: function(event, context) {
    var league = runner(MLB);
    league.web(context.done);
  },
  nfl: function(event, context) {
    var league = runner(NFL);
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
