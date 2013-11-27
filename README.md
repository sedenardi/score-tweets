score-tweets
============

score-tweets is a framework for sending out live score updates via Twitter. This pings different leagues' sites to get score information, detect changes in score, then tweet out the score.

score-tweets also provides an express front end to view the scoring changes, tweet history, and manage server settings.

###score-tweets.js
The main server.

###db.js
Mysql/MariaDB connection handling, plus tailored query methods.

###nhl.js + nhl_model.js
Object definition, methods for parsing NHL games from, object creation from the DB, comparision, and tweet making.

###nfl.js + nfl_model.js
Object definition, methods for parsing NFL games from, object creation from the DB, comparision, and tweet making.

###config.js
Account information, server names, and constants.