'use strict';

var Promise = Promise || require('bluebird');
var zlib = require('bluebird').promisifyAll(require('zlib'));
var config = require('../../config');
var dynamo = require('../../lib/dynamo')(config);
var twitter = require('../../lib/twitter')(config, 'PGA');
var _ = require('lodash');

var Scores = require('../../models/pga/Scores');


var prev = require('../../examples/pga/1460143583372.json');
var next = require('../../examples/pga/1460152861154.json');

var prevObj = Scores.parse(prev);
var nextObj = Scores.parse(next);

var compare = function(newObj) {
  dynamo.get({TableName: 'Leagues', Key: {League: 'PGA'}}).then(function(res) {
    if (res.Item) {
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
      Promise.resolve();
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

compare(nextObj);
