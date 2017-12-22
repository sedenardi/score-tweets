'use strict';

var request = require('request');

module.exports = {
  get: function(url) {
    return new Promise(function(resolve, reject) {
      request({
        url: url
      }, function(err, res, body) {
        if (err) {
          return reject(err);
        }
        return resolve(body);
      });
    });
  }
};
