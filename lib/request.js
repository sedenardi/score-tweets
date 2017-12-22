'use strict';

const request = require('request');

module.exports = {
  get: function(url) {
    return new Promise((resolve, reject) => {
      request({
        url: url
      }, (err, res, body) => {
        if (err) {
          return reject(err);
        }
        return resolve(body);
      });
    });
  }
};
