'use strict';

module.exports = function(league, testObj) {

  const ENABLE_LOGGING = false;
  const log = (msg) => {
    if (ENABLE_LOGGING) {
      console.log(msg);
    }
  };

  const config = require('./config');
  const twitter = require('./lib/twitter')(config, league.leagueName);
  const request = require('./lib/request');
  const _ = require('lodash');
  const moment = require('moment');

  const fetchNextFromWeb = function() {
    log('Fetching scores from league');
    return league.urls().then((urls) => {
      const requests = urls.map((url) => {
        return request.get(url);
      });
      return Promise.all(requests).then((res) => {
        const next = league.Scores.parse(res);
        return Promise.resolve(next);
      });
    });
  };

  const final = (closeDB, db, res) => {
    return (closeDB ? db.end() : Promise.resolve()).then(() => {
      return Promise.resolve(res);
    });
  };

  const getFromStore = (db, allTime) => {
    let closeDB = false;
    if (!db) {
      db = require('./lib/db')();
      closeDB = true;
    }
    const sql = `
    select * from score_tweet.Leagues t1
    where League = ?
    order by id desc limit 1;`;
    log('Fetching scores from database');
    return db.query(sql, [league.leagueName]).then((res) => {
      if (!res[0]) { return final(closeDB, db, null); }

      const createdOn = moment.unix(res[0].CreatedOn);
      const timeSinceLast = moment.duration(moment().diff(createdOn));
      if (timeSinceLast.asMinutes() >= 20 && !allTime && !league.occasionalFetch) {
        console.log('Skipping because existing item is too old');
        return final(closeDB, db, null);
      }
      const scores = JSON.parse(res[0].Data);
      const oldObj = new league.Scores(scores);
      return final(closeDB, db, oldObj);
    });
  };

  const compareAndTweet = function(oldObj, newObj) {
    const changes = newObj.getChanges(oldObj, league);
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
      const tweets = _.map(changes, (status) => {
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

  const saveScores = (db, newObj) => {
    if (testObj && testObj.noSave) {
      return Promise.resolve();
    }
    if (!newObj.Games.length) {
      console.log('No games, not saving');
      return Promise.resolve();
    }
    let closeDB = false;
    if (!db) {
      db = require('./lib/db')();
      closeDB = true;
    }
    const sql = `
    insert into score_tweet.Leagues(League,CreatedOn,\`Data\`)
    values (?,UNIX_TIMESTAMP(),?);`;
    return db.query(sql, [
      league.leagueName,
      JSON.stringify(newObj)
    ]).then(() => {
      console.log('New Item Saved');
      return final(closeDB, db, null);
    });
  };

  const cleanup = (db) => {
    if (moment().minute() !== 0) { return Promise.resolve(); }

    const threshold = moment().subtract(2, 'weeks').unix();
    const sql = 'delete from score_tweet.Leagues where League = ? and CreatedOn < ?';
    return db.query(sql, [league.leagueName, threshold]).then((res) => {
      console.log(`${res.affectedRows} rows cleaned up.`);
      return Promise.resolve();
    });
  };

  return {
    getFromStore,
    web: function(cb) {
      let nextObj = null;
      const db = require('./lib/db')();
      fetchNextFromWeb().then((res) => {
        nextObj = res;
        if (!nextObj) {
          console.log('Bad data from ' + league.urls()[0]);
          return Promise.reject('Bad data from ' + league.urls()[0]);
        }
        if (!nextObj.Games.length) {
          return Promise.reject('No games, skipping');
        }
        return getFromStore(db);
      }).then((oldObj) => {
        if (oldObj) {
          return compareAndTweet(oldObj, nextObj);
        } else {
          return Promise.resolve();
        }
      }).then(() => {
        return saveScores(db, nextObj);
      }).then(() => {
        return cleanup(db);
      }).then(() => {
        return db.end();
      }).then(() => {
        cb(null, 'done');
      }).catch((err) => {
        console.log(err);
        return db.end().then(() => {
          if (err === 'No games, skipping') {
            cb(null, err);
          } else {
            cb(err);
          }
        });
      });
    },
    getChanges: function(cb, allTime) {
      let nextObj = null;
      const db = require('./lib/db')();
      fetchNextFromWeb().then((res) => {
        nextObj = res;
        console.log('New scores: ' + nextObj.getScores().length);
        if (!nextObj) {
          console.log('Bad data from ' + league.urls()[0]);
          return Promise.reject('Bad data from ' + league.urls()[0]);
        }
        return getFromStore(db, allTime);
      }).then((oldObj) => {
        if (oldObj) {
          console.log('Old scores: ' + oldObj.getScores().length);
          const changes = nextObj.getChanges(oldObj, league);
          if (changes.length) {
            console.log(changes);
          } else {
            console.log('No Changes');
          }
          return Promise.resolve();
        } else {
          return Promise.resolve();
        }
      }).then(() => {
        return saveScores(db, nextObj);
      }).then(() => {
        return db.end();
      }).then(() => {
        cb(null, 'done');
      }).catch((err) => {
        console.log(err);
        cb(err);
      });
    },
    fetch: function(cb) {
      fetchNextFromWeb().then((res) => {
        cb(null, res);
      }).catch((err) => {
        cb(err);
      });
    }
  };
};
