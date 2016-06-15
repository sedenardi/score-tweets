'use strict';

var Promise = Promise || require('bluebird');

module.exports = {
  leagueName: 'NHL',
  urls: function() {
    return Promise.resolve(['http://live.nhle.com/GameData/RegularSeasonScoreboardv3.jsonp']);
  },
  Scores: require('../models/nhl/Scores')
};
