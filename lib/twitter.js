'use strict';

var Twitter = require('twitter');
const _ = require('lodash');

module.exports = function(config, league) {
  const leagueConfig = config.twitter(league);
  var client = new Twitter(leagueConfig);

  var retryablePost = function(statusObj, cb) {
    client.post('statuses/update', statusObj, function(error, tweet){
      if (error) {
        if (error.length) {
          if (error[0].code === 187) {
            console.log('Dupe tweet.');
            return cb();
          }
        }
        console.log(error);
        setTimeout(function() {
          retryablePost(status, cb);
        }, 1000 * 8);
      } else {
        console.log(tweet.user.name + ': ' + tweet.text);
        cb(null, tweet);
      }
    });
  };

  var post = function(statusObj) {
    return new Promise(function(resolve, reject) {
      retryablePost(statusObj, function(err, res) {
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
      return _.reduce(statuses, function(res, v) {
        res = res.then(function(tweet) {
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
