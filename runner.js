'use strict';

module.exports = function(league, testObj) {

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

  const final = (closeDB, db, res) => {
    return (closeDB ? db.end() : Promise.resolve()).then(() => {
      return Promise.resolve(res);
    });
  };

  const getFromStore = function(db, allTime) {
    let closeDB = false;
    if (!db) {
      db = require('./lib/db')();
      closeDB = true;
    }
    const sql = `
    select * from score_tweet.Leagues t1
    where League = ?
    and not exists (
      select 1 from score_tweet.Leagues t2
      where t2.League = t1.League
      and t2.id > t1.id
    );`;
    return db.query(sql, [league.leagueName]).then((res) => {
      if (!res[0]) { return final(closeDB, db, null); }

      const timeSinceLast = moment.duration(moment().diff(res[0].CreatedOn));
      if (timeSinceLast.asMinutes() >= 20 && !allTime && !league.occasionalFetch) {
        console.log('Skipping because existing item is too old');
        return final(closeDB, db, null);
      }
      const scores = JSON.parse(res[0].Data);
      const oldObj = new league.Scores(scores);
      return final(closeDB, db, oldObj);
    });
  };

  var getFromDynamo = function(allTime) {
    return dynamo.get({TableName: 'Leagues', Key: {League: league.leagueName}}).then(function(res) {
      if (res.Item) {
        var timeSinceLast = moment.duration(moment().diff(res.Item.CreatedOn));
        if (timeSinceLast.asMinutes() >= 20 && !allTime && !league.occasionalFetch) {
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
    var changes = newObj.getChanges(oldObj, league);
    if (changes.length) {
      console.log('Found ' + changes.length + ' changes.');
    }
    if (league.seqTweet) {
      if (testObj && testObj.noTweet) {
        console.log(changes);
        return Promise.resolve();
      } else {
        return twitter.seqPost(changes);
      }
    } else {
      var tweets = _.map(changes, function(status) {
        if (testObj && testObj.noTweet) {
          console.log(status);
          return Promise.resolve();
        } else {
          return twitter.post(status);
        }
      });
      return Promise.all(tweets);
    }
  };

  var saveNewObj = function(newObj) {
    if (testObj && testObj.noSave) {
      return Promise.resolve();
    }
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
    getFromStore,
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
          var changes = nextObj.getChanges(oldObj, league);
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
