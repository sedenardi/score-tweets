'use strict';

var moment = require('moment');

module.exports = {
  leagueName: 'MLB',
  url: function(yesterday) {
    var date = yesterday ? moment().subtract(1, 'days') : moment();
    var url = 'http://mlb.mlb.com/gdcross/components/game/mlb/year_' +
      date.format('YYYY') +
      '/month_' + date.format('MM') +
      '/day_' + date.format('DD') +
      '/master_scoreboard.json';
    return url;
  },
  urls: function() {
    return Promise.resolve([this.url(true), this.url(false)]);
  },
  Scores: require('../models/mlb/Scores')
};
