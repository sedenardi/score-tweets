'use strict';

var Promise = Promise || require('bluebird');

module.exports = function(config) {
  var AWS = config.AWS();
  var dynamodb = new AWS.DynamoDB();
  var docClient = new AWS.DynamoDB.DocumentClient();
  return {
    get: function(query) {
      return new Promise(function(resolve, reject) {
        docClient.get(query, function(err, res) {
          if (err) {
            return reject(err);
          }
          return resolve(res);
        });
      });
    },
    put: function(params) {
      return new Promise(function(resolve, reject) {
        docClient.put(params, function(err, res) {
          if (err) {
            return reject(err);
          }
          return resolve(res);
        });
      });
    },
    deleteTable: function(params) {
      return new Promise(function(resolve, reject) {
        dynamodb.deleteTable(params, function(err, res) {
          if (err) {
            return reject(err);
          }
          return resolve(res);
        });
      });
    },
    createTable: function(params) {
      return new Promise(function(resolve, reject) {
        dynamodb.createTable(params, function(err, res) {
          if (err) {
            return reject(err);
          }
          return resolve(res);
        });
      });
    }
  };
};
