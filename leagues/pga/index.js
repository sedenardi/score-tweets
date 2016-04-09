'use strict';

var Promise = Promise || require('bluebird');
var zlib = require('bluebird').promisifyAll(require('zlib'));
var config = require('../../config');
var dynamo = require('../../lib/dynamo')(config);
var twitter = require('../../lib/twitter')(config, 'PGA');
var request = require('../../lib/request');
var _ = require('lodash');
var moment = require('moment');

var Scores = require('../../models/pga/Scores');
var url = 'http://www.pgatour.com/data/r/014/leaderboard-v2.json';

// var prev = require('../../examples/pga/1460143583372.json');
// var next = require('../../examples/pga/1460152861154.json');
//
// var prevObj = Scores.parse(prev);
// var nextObj = Scores.parse(next);

var compareAndSave = function(newObj) {
  return dynamo.get({TableName: 'Leagues', Key: {League: 'PGA'}}).then(function(res) {
    if (res.Item) {
      var timeSinceLast = moment.duration(moment().diff(res.Item.CreatedOn));
      if (timeSinceLast.asMinutes() >= 20) {
        console.log('Skipping because existing item is too old');
        return Promise.resolve();
      }
      return zlib.gunzipAsync(res.Item.Scores).then(function(unzipped) {
        var scores = JSON.parse(unzipped);
        var oldObj = new Scores(scores);
        var changes = newObj.getChanges(oldObj);
        if (changes.length) {
          console.log('Found ' + changes.length + ' changes.');
        }
        var tweets = _.map(changes, function(status) {
          return twitter.post(status);
        });
        return Promise.all(tweets);
      });
      //Promise.resolve();
    } else {
      return Promise.resolve();
    }
  }).then(function() {
    return zlib.gzipAsync(JSON.stringify(newObj));
  }).then(function(zipped) {
    return dynamo.put({
      TableName: 'Leagues',
      Item: {
        League: 'PGA',
        Scores: zipped,
        CreatedOn: (new Date()).toISOString()
      }
    });
  }).then(function() {
    console.log('New Item Saved');
  }).catch(function(err) {
    console.log(err);
  });
};

var fetchNextFromWeb = function() {
  return request.get(url).then(function(res) {
    var next = Scores.parse(res);
    return Promise.resolve(next);
  });
};

module.exports = function(cb) {
  fetchNextFromWeb().then(function(nextObj) {
    if (!nextObj) {
      console.log('Bad data from ' + url);
      return Promise.reject('Bad data from ' + url);
    }
    return compareAndSave(nextObj);
  }).then(function() {
    cb(null, 'done');
  }).catch(function(err) {
    console.log(err);
    cb(err);
  });
};
