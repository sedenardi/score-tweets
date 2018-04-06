'use strict';

const moment = require('moment');
const _ = require('lodash');
const request = require('../lib/request');

module.exports = {
  leagueName: 'PGA',
  urls: function()  {
    return request.get('https://statdata.pgatour.com/r/current/schedule-v2.json').then((res) => {
      const schedule = JSON.parse(res);
      const weekNumber = schedule.thisWeek.weekNumber;
      const yString = moment().year().toString();
      const year = _.find(schedule.years, { year: yString });
      if (!year) {
        return Promise.resolve([]);
      }
      const tour = _.find(year.tours, {desc: 'PGA TOUR'});
      if (!tour) {
        return Promise.resolve([]);
      }
      const current = _.find(tour.trns, (t) => {
        return  t.date.weekNumber === weekNumber &&
                t.FedExCup === 'Yes' &&
                t.primaryEvent === 'Y';
      });
      if (!current) {
        return Promise.resolve([]);
      }
      const url = `https://statdata.pgatour.com/r/${current.permNum}/${yString}/leaderboard-v2.json`;
      return Promise.resolve([url]);
    });
  },
  Scores: require('../models/pga/Scores'),
  occasionalFetch: true,
  twitterName: 'PGATweetZone',
  seqTweet: true
};
