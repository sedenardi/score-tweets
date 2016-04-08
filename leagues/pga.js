'use strict';

var Promise = Promise || require('bluebird');
var Scores = require('../models/pga/Scores');

var prev = require('../examples/pga/1460123743812.json');
var next = require('../examples/pga/1460133163284.json');

var prevObj = Scores.parse(prev);
var nextObj = Scores.parse(next);

var change = nextObj.getChanges(prevObj);
console.log(JSON.stringify(change, null, 2));
