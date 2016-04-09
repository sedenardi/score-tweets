'use strict';

var config = require('./config');
var dynamo = require('./lib/dynamo')(config);

var leagueTable = {
  TableName: 'Leagues',
  KeySchema: [
    { AttributeName: 'League', KeyType: 'HASH'}
  ],
  AttributeDefinitions: [
    { AttributeName: 'League', AttributeType: 'S' }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1
  }
};

var create = function() {
  dynamo.createTable(leagueTable).then(function(res) {
    console.log(res);
  }).catch(function(err) {
    console.log(err);
  });
};

var drop = function() {
  dynamo.deleteTable({TableName: 'Leagues'}).then(function(res) {
    console.log(res);
  }).catch(function(err) {
    console.log(err);
  });
};

create();
//drop();
