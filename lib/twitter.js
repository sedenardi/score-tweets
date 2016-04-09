'use strict';

var Promise = Promise || require('bluebird');
var Twitter = require('twitter');

module.exports = function(config, league) {
  var client = new Twitter(config.twitter(league));

  var retryablePost = function(status, cb) {
    client.post('statuses/update', {status: status}, function(error, tweet, response){
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
        }, 1000*30);
      } else {
        console.log(tweet.user.name + ': ' + tweet.text);
        cb(null, response);
      }
    });

  };

  return {
    post: function(status) {
      return new Promise(function(resolve, reject) {
        retryablePost(status, function(err, res) {
          if (err) {
            return reject(err);
          }
          return resolve(res);
        });
      });
    }
  };
};
