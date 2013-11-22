score-tweets
============

score-tweets is a framework for sending out live score updates via Twitter. This pings different leagues' sites to get score information, detect changes in score, then tweet out the score.

score-tweets also provides an express front end to view the scoring changes, tweet history, and manage server settings.

###score-tweets.js
The main server.

###nhl.js
Object definition and methods for parsing NHL games from nhl.com.

###nfl.js
Object definition and methods for parsing NFL games from nfl.com.