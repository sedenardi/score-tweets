'use strict';

const moment = require('moment');
const _ = require('lodash');
const request = require('../lib/request');

module.exports = {
  leagueName: 'PGA',
  urls: function()  {
    return request.get('http://www.pgatour.com/data/r/current/schedule.json').then((res) => {
      const schedule = JSON.parse(res);
      const now = moment();
      const tour = _.find(schedule.tours, {desc: 'PGA TOUR'});
      if (!tour) {
        return Promise.resolve([]);
      }
      const current = _.find(tour.trns, (t) => {
        return  now > moment(t.date.start) && now < moment(t.date.end).add(1, 'd') &&
                t.FedExCup === 'Yes' &&
                t.primaryEvent === 'Y';
      });
      if (!current) {
        return Promise.resolve([]);
      }
      const url = `http://www.pgatour.com/data/r/${current.permNum}/leaderboard-v2.json`;
      return Promise.resolve([url]);
    });
  },
  Scores: require('../models/pga/Scores'),
  occasionalFetch: true,
  twitterName: 'PGATweetZone',
  seqTweet: true
};
