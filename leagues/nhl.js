'use strict';

module.exports = {
  leagueName: 'NHL',
  urls: function() {
    return ['http://live.nhle.com/GameData/RegularSeasonScoreboardv3.jsonp'];
  },
  Scores: require('../models/nhl/Scores')
};
