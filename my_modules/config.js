var config = { };

config.mysql = {
	host: 'dbhost',
	post: 'port',
	user: 'username',
	password: 'password',
	database: 'dbname'
};

config.leagues = {
	NHL: {
		refreshInterval: 30000
	},
	NFL: {
		refreshInterval: 30000
	}
};

config.twitter = {
	app: {
		consumer_key: 'key',
		consumer_secret: 'secret'
	},
	leagues: {
		NHL: {
			username: '',
			access_token_key: '',
			access_token_secret: ''
		},
		NFL: {
			username: '',
			access_token_key: '',
			access_token_secret: ''
		}
	}
};

module.exports = config;
