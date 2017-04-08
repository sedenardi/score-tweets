'use strict';

const PGA = require('./leagues/pga');
const config = require('./config');
const dynamo = require('./lib/dynamo')(config);
const zlib = require('bluebird').promisifyAll(require('zlib'));
const _ = require('lodash');

const getFinalScore = function(params) {
  let names = params.names;
  if (typeof names === 'string') {
    names = _.map(names.split(','), (s) => { return s.trim(); });
  }
  return dynamo.get({TableName: 'Leagues', Key: {League: PGA.leagueName}}).then((res) => {
    if (!res.Item) {
      return Promise.resolve({ });
    }
    return zlib.gunzipAsync(res.Item.Scores).then((unzipped) => {
      const scores = JSON.parse(unzipped);
      const scoreObj = new PGA.Scores(scores);
      const players = scoreObj.getPlayers(names);
      return Promise.resolve(players);
    });
  });
};

module.exports = {
  getFinalScore
};
