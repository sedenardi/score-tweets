'use strict';

var runner = require('./runner');
var PGA = require('./leagues/pga');
var NHL = require('./leagues/nhl');
var MLB = require('./leagues/mlb');
var NFL = require('./leagues/nfl');

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
  }
};
