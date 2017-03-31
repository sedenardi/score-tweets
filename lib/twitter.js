'use strict';

var Promise = Promise || require('bluebird');
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
    }
  };
};
