'use strict';

var Promise = Promise || require('bluebird');
var config = require('../../config');
var dynamo = require('../../lib/dynamo')(config);

var Scores = require('../../models/pga/Scores');


var prev = require('../../examples/pga/1460053094402.json');
var next = require('../../examples/pga/1460075363587.json');

var prevObj = Scores.parse(prev);
var nextObj = Scores.parse(next);

var compare = function(newObj) {
  dynamo.get({TableName: 'Leagues', Key: {League: 'PGA'}}).then(function(res) {
    if (res.Item) {
      var scores = JSON.parse(res.Item.Scores);
      var oldObj = new Scores(scores);
      var changes = newObj.getChanges(oldObj);
      console.log(changes);
    }
    return dynamo.put({TableName: 'Leagues', Item: newObj.dynamoObj()});
  }).then(function() {
    console.log('New Item Saved');
  }).catch(function(err) {
    console.log(err);
  });
};

compare(nextObj);
