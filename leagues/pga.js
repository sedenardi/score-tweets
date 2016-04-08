'use strict';

var Promise = Promise || require('bluebird');
var Scores = require('./models/Scores');

var prev = require('../../examples/pga/1460053094402.json');
var next = require('../../examples/pga/1460075363587.json');

var prevObj = Scores.parse(prev);
var nextObj = Scores.parse(next);

var change = nextObj.getChanges(prevObj);
console.log(JSON.stringify(change, null, 2));
