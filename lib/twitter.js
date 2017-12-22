'use strict';

const Twitter = require('twitter');
const _ = require('lodash');

module.exports = function(config, league) {
  const leagueConfig = config.twitter(league);
  const client = new Twitter(leagueConfig);

  const retryablePost = function(statusObj, cb) {
    client.post('statuses/update', statusObj, (error, tweet) => {
      if (error) {
        if (error.length) {
          if (error[0].code === 187) {
            console.log('Dupe tweet.');
            return cb();
          }
        }
        console.log(error);
        setTimeout(() => {
          retryablePost(status, cb);
        }, 1000 * 8);
      } else {
        console.log(tweet.user.name + ': ' + tweet.text);
        cb(null, tweet);
      }
    });
  };

  const post = function(statusObj) {
    return new Promise((resolve, reject) => {
      retryablePost(statusObj, (err, res) => {
        if (err) {
          return reject(err);
        }
        return resolve(res);
      });
    });
  };

  const getFollowers = function(cursor) {
    return new Promise((resolve, reject) => {
      const params = { count: 200, skip_status: true };
      if (cursor) { params.cursor = cursor; }
      client.get('followers/list', params, (err, res) => {
        if (err) { return reject(err); }
        return resolve(res);
      });
    });
  };

  const getAllFollowers = function(cursor, users) {
    users = users || [];
    return getFollowers(cursor).then((res) => {
      if (!res.users.length) {
        return Promise.resolve(users);
      }
      users = users.concat(res.users);
      return getAllFollowers(res.next_cursor_str, users);
    });
  };

  const getFriends = function(cursor) {
    return new Promise((resolve, reject) => {
      const params = { count: 200, skip_status: true };
      if (cursor) { params.cursor = cursor; }
      client.get('friends/list', params, (err, res) => {
        if (err) { return reject(err); }
        return resolve(res);
      });
    });
  };

  const getAllFriends = function(cursor, users) {
    users = users || [];
    return getFriends(cursor).then((res) => {
      if (!res.users.length) {
        return Promise.resolve(users);
      }
      users = users.concat(res.users);
      return getAllFollowers(res.next_cursor_str, users);
    });
  };

  return {
    post: function(status) {
      return post({status: status});
    },
    seqPost: function(statuses) {
      return _.reduce(statuses, (res, v) => {
        res = res.then((tweet) => {
          const statusObj = { status: v };
          if (tweet) {
            statusObj.in_reply_to_status_id = tweet.id_str;
          }
          return post(statusObj);
        });
        return res;
      }, Promise.resolve());
    },
    getFollowers: function() {
      return getAllFollowers().then((res) => {
        const ids = _.map(res, 'id_str');
        return Promise.resolve(ids);
      });
    },
    getAllFriends: function() {
      return getAllFriends().then((res) => {
        const ids = _.map(res, 'id_str');
        return Promise.resolve(ids);
      });
    }
  };
};
