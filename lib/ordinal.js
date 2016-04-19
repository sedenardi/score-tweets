'use strict';

module.exports = function(num, pos) {
  var str = '';
  if (num === -1) {
    return str;
  }
  pos = pos || num;
  var ones = num % 10;
  var teens = num % 100;
  if (ones === 1 && teens !== 11) {
    str = pos + 'st';
  } else if (ones === 2 && teens !== 12) {
    str = pos + 'nd';
  } else if (ones === 3 && teens !== 13) {
    str = pos + 'rd';
  } else {
    str = pos + 'th';
  }
  return str;
};
