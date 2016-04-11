'use strict';

var runner = require('./runner');
var PGA = require('./leagues/pga');
var NHL = require('./leagues/nhl');

module.exports = {
  pga: function(event, context) {
    var league = runner(PGA);
    league.web(context.done);
  },
  nhl: function(event, context) {
    var league = runner(NHL);
    league.web(context.done);
  }
};
