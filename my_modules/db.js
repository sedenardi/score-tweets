var mysql = require('../node_modules/mysql')
,	config = require('./config.js');

var connection;

var handleDisconnect = function(caller, next) {
  connection = mysql.createConnection(config.mysql); // Recreate the connection, since
                                                  // the old one cannot be reused.

  connection.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('MYSQL-' + caller + ': error when connecting to db: ', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    } else {                              // to avoid a hot loop, and to allow our node script to
      console.log('MYSQL-' + caller + ': connect success'); // process asynchronous requests in the meantime.
      next();
    }                                     // If you're also serving http, display a 503 error
  });
  connection.on('error', function(err) {
    console.log('MYSQL-' + caller + ': db error ', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect('self',null);                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
};	

var disconnect = function() {
	connection.end(function (err) {
		if (err) {
			console.log('MYSQL: ', err);
		} else {
			console.log('MYSQL: disconnected');
		}
	});
};

/**** FUNCTIONS ****/
var select1 = function(next) {
	connection.query('Select 1 as one;', function(err, res) {
		if (err) {
			console.log('MYSQL: ', err);
		} else {
			console.log('MYSQL: ', res);
			next(res);
		}
	});
};

var query = function(stmnt, inserts, next) {
	var sql = connection.format(stmnt, inserts);
	connection.query(sql, function(err, res) {
		if (err) {
			console.log('MYSQL: ' + sql + ' \n' + err);
		} else {
			next(res);
		}
	});
};

/***** EXPORTS *****/
module.exports.connect = handleDisconnect;
module.exports.disconnect = disconnect;
module.exports.select1 = select1;
module.exports.query = query;