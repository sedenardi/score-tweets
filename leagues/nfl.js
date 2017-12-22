'use strict';

module.exports = {
  leagueName: 'NFL',
  urls: function() {
    const now = Date.now();
    return Promise.resolve([
      `http://www.nfl.com/liveupdate/scores/scores.json?random=${now}`,
      'http://www.nfl.com/liveupdate/scorestrip/scorestrip.json'
    ]);
  },
  Scores: require('../models/nfl/Scores')
};
