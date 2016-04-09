var PGA = require('./leagues/pga/index');

module.exports = {
  pga: function(event, context) {
    PGA(context.done);
  }
};
