'use strict';

const Player = require('./Player');
const _ = require('lodash');
const moment = require('moment-timezone');

const Scores = function(scores) {
  this.Timestamp = scores.Timestamp;
  this.Tournament = scores.Tournament;
  this.Players = _.map(scores.Players, (p) => { return new Player(p); });
};

Scores.parse = function(raw) {
  try {
    raw = JSON.parse(raw[0]);
  } catch (e) {
    return new Scores({ Timestamp: 0, Players: [] });
  }
  if (!raw || !raw.time_stamp || !raw.leaderboard || !raw.leaderboard.players) {
    return new Scores({ Timestamp: 0, Players: [] });
  }
  return new Scores({
    Timestamp: parseInt(raw.time_stamp),
    Tournament: raw.debug.tournament_in_schedule_file_name,
    Players: _.chain(raw.leaderboard.players)
      .filter((p) => { return p.status !== 'cut'; })
      .map((p) => { return Player.parse(p); })
      .value()
  });
};

Scores.prototype.getScores = function() {
  return this.Players;
};

Scores.prototype.getPlayer = function(otherPlayer) {
  return _.find(this.Players, function(p) {
    return p.equals(otherPlayer);
  });
};

Scores.prototype.isFinished = function() {
  return _.every(this.Players, (p) => { return p.isFinished(); });
};

Scores.prototype.getChanges = function(prev, league) {
  if (this.isFinished() && prev.isFinished()) {
    return [];
  }
  const leaders = _.filter(this.Players, (p) => { return p.isLeaderboard(); });
  const anyPlaying = _.some(leaders, (p) => { return !p.isFinished(); });
  if (!anyPlaying.length) {
    return [];
  }
  const strings = _(leaders)
    .orderBy([(p) => { return p.positionNum(); }], ['asc'])
    .map((p) => { return p.leaderString(); })
    .value();
  const tweets = _.reduce(strings, (res, v) => {
    let nextStr = res[res.length - 1];
    nextStr += `\n${v}`;
    if (nextStr.length < 140) {
      res[res.length - 1] = nextStr;
    } else {
      res.push(`@${league.twitterName}\n${v}`);
    }
    return res;
  }, [`${this.Tournament}, ${moment().tz('America/New_York').format('h:mma z')}`]);
  return tweets;
};

Scores.prototype.getPlayers = function(names) {
  const scores = _.chain(this.Players)
    .filter((p) => {
      if (p.Last === 'Moore') {
        console.log(p);
        console.log(p.isFinished());
        console.log(names);
      }
      return p.isFinished() && _.some(names, (n) => { return p.nameEquals(n); });
    })
    .map((p) => {
      const n = _.find(names, (n) => { return p.nameEquals(n); });
      return {
        Name: n,
        Score: p.RoundTotal + 72
      };
    })
    .value();
  return _.reduce(scores, (res, v) => {
    res[v.Name] = v.Score;
    return res;
  }, {});
};

module.exports = Scores;
