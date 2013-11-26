var mysql = require('../node_modules/mysql')
,	config = require('./config.js');

var connection;

var handleDisconnect = function(next) {
  connection = mysql.createConnection(config.mysql); // Recreate the connection, since
                                                  // the old one cannot be reused.

  connection.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('MYSQL: error when connecting to db: ', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    } else {                              // to avoid a hot loop, and to allow our node script to
      console.log('MYSQL: connect success'); // process asynchronous requests in the meantime.
      next();
    }                                     // If you're also serving http, display a 503 error
  });
  connection.on('error', function(err) {
    console.log('MYSQL: db error ', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
};

module.exports.connect = function (next) {
	handleDisconnect(next);
};

module.exports.disconnect = function() {
	connection.end(function (err) {
		if (err) {
			console.log('MYSQL: ', err);
		} else {
			console.log('MYSQL: disconnected');
		}
	});
};

module.exports.select1 = function() {
	connection.query('Select 1 as one;', function(err, res) {
		if (err) {
			console.log('MYSQL: ', err);
		} else {
			console.log('MYSQL: ', res);
		}
	});
};

module.exports.query = function(query,object) {
	var sql = mysql.format(query, object);
	connection.query(sql, function(err, res) {
		if (err) {
			console.log('MYSQL: ' + sql + ' \n' + err);
		} else {
			return res;
		}
	});
};
