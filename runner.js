'use strict';

module.exports = function(league, test) {

  var Promise = Promise || require('bluebird');
  var zlib = require('bluebird').promisifyAll(require('zlib'));
  var config = require('./config');
  var dynamo = require('./lib/dynamo')(config);
  var twitter = require('./lib/twitter')(config, league.leagueName);
  var request = require('./lib/request');
  var _ = require('lodash');
  var moment = require('moment');

  var fetchNextFromWeb = function() {
    return league.urls().then(function(urls) {
      var requests = urls.map(function(url) {
        return request.get(url);
      });
      return Promise.all(requests).then(function(res) {
        var next = league.Scores.parse(res);
        return Promise.resolve(next);
      });
    });
  };

  var getFromDynamo = function(allTime) {
    return dynamo.get({TableName: 'Leagues', Key: {League: league.leagueName}}).then(function(res) {
      if (res.Item) {
        var timeSinceLast = moment.duration(moment().diff(res.Item.CreatedOn));
        if (timeSinceLast.asMinutes() >= 20 && !allTime) {
          console.log('Skipping because existing item is too old');
          return Promise.resolve(null);
        }
        return zlib.gunzipAsync(res.Item.Scores).then(function(unzipped) {
          var scores = JSON.parse(unzipped);
          var oldObj = new league.Scores(scores);
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
      if (!test) {
        return twitter.post(status);
      } else {
        console.log(status);
        return Promise.resolve();
      }
    });
    return Promise.all(tweets);
  };

  var saveNewObj = function(newObj) {
    return zlib.gzipAsync(JSON.stringify(newObj)).then(function(zipped) {
      return dynamo.put({
        TableName: 'Leagues',
        Item: {
          League: league.leagueName,
          Scores: zipped,
          CreatedOn: (new Date()).toISOString()
        }
      });
    }).then(function() {
      console.log('New Item Saved');
      return Promise.resolve();
    });
  };

  return {
    web: function(cb) {
      var nextObj = null;
      fetchNextFromWeb().then(function(res) {
        nextObj = res;
        if (!nextObj) {
          console.log('Bad data from ' + league.urls()[0]);
          return Promise.reject('Bad data from ' + league.urls()[0]);
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
    },
    getChanges: function(cb, allTime) {
      var nextObj = null;
      fetchNextFromWeb().then(function(res) {
        nextObj = res;
        console.log('New scores: ' + nextObj.getScores().length);
        if (!nextObj) {
          console.log('Bad data from ' + league.urls()[0]);
          return Promise.reject('Bad data from ' + league.urls()[0]);
        }
        return getFromDynamo(allTime);
      }).then(function(oldObj) {
        if (oldObj) {
          console.log('Old scores: ' + oldObj.getScores().length);
          var changes = nextObj.getChanges(oldObj);
          if (changes.length) {
            console.log(changes);
          } else {
            console.log('No Changes');
          }
          return Promise.resolve();
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
    },
    fetch: function(cb) {
      fetchNextFromWeb().then(function(res) {
        cb(null, res);
      }).catch(function(err) {
        cb(err);
      });
    }
  };
};
