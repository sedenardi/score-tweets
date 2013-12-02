score-tweets
============

score-tweets is a framework for sending out live score updates via Twitter. This pings different leagues' sites to get score information, detect changes in score, then tweet out the score.

score-tweets also provides an express front end to view the scoring changes, tweet history, and manage server settings.

###score-tweets.js
The main server.

###db.js
Mysql/MariaDB connection handling, plus tailored query methods.

###leagueManager.js
Fetches, compares, and stores scores for a given league.

###nhl.js
Object definition, methods for parsing games, and queries for NHL games.

###nfl.js
Object definition, methods for parsing games, and queries for NHL games.

###config.js
Account information, server names, and constants.

###/sql_models
Table definitions for leagues, plus teams information for each specified league.
