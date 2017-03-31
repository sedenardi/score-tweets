'use strict';

var Player = require('./Player');
var _ = require('lodash');

var Scores = function(scores) {
  this.Timestamp = scores.Timestamp;
  this.Tournament = scores.Tournament;
  this.Players = _.map(scores.Players, function(p) { return new Player(p); });
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
    Players: _.map(raw.leaderboard.players, function(p) { return Player.parse(p); })
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
  const leaders = _(this.Players)
    .filter(function(p) { return p.isLeaderboard(); })
    .orderBy([function(p) { return p.positionNum(); }], ['asc'])
    .map(function(p) { return p.leaderString(); })
    .value();
  const tweets = _.reduce(leaders, function(res, v) {
    let nextStr = res[res.length - 1];
    nextStr += `\n${v}`;
    if (nextStr.length < 140) {
      res[res.length - 1] = nextStr;
    } else {
      res.push(`@${league.twitterName}\n${v}`);
    }
    return res;
  }, [this.Tournament]);
  return tweets;
};

module.exports = Scores;
