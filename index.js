var PGA = require('./leagues/pga/index');

module.exports = {
  pga: function(event, context) {
    PGA.web(context.done);
  },
  pgaTest: function(event, context) {
    PGA.test(context.done);
  }
};
