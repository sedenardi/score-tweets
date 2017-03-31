'use strict';

var Promise = Promise || require('bluebird');
var moment = require('moment');
var _ = require('lodash');
var request = require('../lib/request');

module.exports = {
  leagueName: 'PGA',
  urls: function()  {
    return request.get('http://www.pgatour.com/data/r/current/schedule.json').then(function(res) {
      var schedule = JSON.parse(res);
      var now = moment();
      var tour = _.find(schedule.tours, {desc: 'PGA TOUR'});
      if (!tour) {
        return Promise.resolve([]);
      }
      var current = _.find(tour.trns, function(t) {
        return  now > moment(t.date.start) && now < moment(t.date.end).add(1, 'd') &&
                t.FedExCup === 'Yes' &&
                t.primaryEvent === 'Y';
      });
      if (!current) {
        return Promise.resolve([]);
      }
      var url = `http://www.pgatour.com/data/r/${current.permNum}/leaderboard-v2.json`;
      return Promise.resolve([url]);
    });
  },
  Scores: require('../models/pga/Scores'),
  occasionalFetch: true,
  twitterName: 'PGATweetZone',
  seqTweet: true
};
