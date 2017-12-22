'use strict';

const PGA = require('./leagues/pga');
const _ = require('lodash');

const getFinalScore = function(params) {
  const db = require('./lib/db')();
  let names = params.names;
  if (typeof names === 'string') {
    names = _.map(names.split(','), (s) => { return s.trim(); });
  }
  const sql = `
  select * from score_tweet.Leagues t1
  where League = 'PGA'
  and not exists (
    select 1 from score_tweet.Leagues t2
    where t2.League = t1.League
    and t2.id > t1.id
  );`;
  return db.query(sql).then((res) => {
    let players = { };
    if (res[0]) {
      const scores = JSON.parse(res[0].Data);
      const scoreObj = new PGA.Scores(scores);
      players = scoreObj.getPlayers(names);
    }
    return db.end().then(() => {
      return Promise.resolve(players);
    });
  });
};

module.exports = {
  getFinalScore
};
