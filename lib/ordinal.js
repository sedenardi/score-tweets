'use strict';

module.exports = function(num, pos) {
  let str = '';
  if (num === -1) {
    return str;
  }
  if (isNaN(parseInt(num))) {
    return str;
  }
  num = parseInt(num);
  pos = pos || num;
  const ones = num % 10;
  const teens = num % 100;
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
