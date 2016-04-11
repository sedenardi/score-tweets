'use strict';

module.exports = {
  leagueName: 'PGA',
  urls: function()  {
    return ['http://www.pgatour.com/data/r/014/leaderboard-v2.json'];
  },
  Scores: require('../models/pga/Scores')
};
