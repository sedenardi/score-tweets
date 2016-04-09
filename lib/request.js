'use strict';

var Promise = Promise || require('bluebird');
var request = require('request');

module.exports = {
  get: function(url) {
    return new Promise(function(resolve, reject) {
      request({
        url: url,
        json: true
      }, function(err, res, body) {
        if (err) {
          return reject(err);
        }
        return resolve(body);
      });
    });
  }
};
