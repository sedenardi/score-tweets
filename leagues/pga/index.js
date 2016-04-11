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

var fetchNextFromWeb = function() {
  return request.get(url).then(function(res) {
    var next = Scores.parse(res);
    return Promise.resolve(next);
  });
};

var getFromDynamo = function() {
  return dynamo.get({TableName: 'Leagues', Key: {League: 'PGA'}}).then(function(res) {
    if (res.Item) {
      var timeSinceLast = moment.duration(moment().diff(res.Item.CreatedOn));
      if (timeSinceLast.asMinutes() >= 20) {
        console.log('Skipping because existing item is too old');
        return Promise.resolve(null);
      }
      return zlib.gunzipAsync(res.Item.Scores).then(function(unzipped) {
        var scores = JSON.parse(unzipped);
        var oldObj = new Scores(scores);
        return Promise.resolve(oldObj);
      });
    } else {
      return Promise.resolve(null);
    }
  });
};

var compareAndTweet = function(oldObj, newObj) {
  var changes = newObj.getChanges(oldObj);
  if (changes.length) {
    console.log('Found ' + changes.length + ' changes.');
  }
  var tweets = _.map(changes, function(status) {
    return twitter.post(status);
  });
  return Promise.all(tweets);
};

var saveNewObj = function(newObj) {
  return zlib.gzipAsync(JSON.stringify(newObj)).then(function(zipped) {
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
    return Promise.resolve();
  });
};

module.exports = {
  web: function(cb) {
    var nextObj = null;
    fetchNextFromWeb().then(function(res) {
      nextObj = res;
      if (!nextObj) {
        console.log('Bad data from ' + url);
        return Promise.reject('Bad data from ' + url);
      }
      return getFromDynamo();
    }).then(function(oldObj) {
      if (oldObj) {
        return compareAndTweet(oldObj, nextObj);
      } else {
        return Promise.resolve();
      }
    }).then(function() {
      return saveNewObj(nextObj);
    }).then(function() {
      cb(null, 'done');
    }).catch(function(err) {
      console.log(err);
      cb(err);
    });
  }
};
