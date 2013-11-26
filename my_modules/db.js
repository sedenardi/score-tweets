var mysql = require('../node_modules/mysql')
,	config = require('./config.js');

var connection = mysql.createConnection(config.mysql);

connection.connect(function(err) {
	if (err) {
		console.log('MYSQL: ', err);
	}
});

module.export = connection;