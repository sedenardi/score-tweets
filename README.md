score-tweets
============

score-tweets is a framework for sending out live score updates via Twitter. This pings different leagues' sites to get score information, detect changes in score, then tweet out the score.

score-tweets also provides an express front end to view the scoring changes, tweet history, and manage server settings.

### score-tweets.js
The main server.

### db.js
Mysql/MariaDB connection handling, plus tailored query methods.

### web.js
Express web server, handles twitter authentication via passport(-twitter).

### helpers.js
Collection of Handbars helpers.

### leagueManager.js
Fetches, compares, and stores scores for a given league.

### nhl.js & nfl.js
Object definition, methods for parsing games, and queries for NHL & NFL games.

### config.js
Account information, server names, and constants.

### /sql_models
Table definitions for leagues, plus teams information for each specified league.

## License

The MIT License (MIT)

Copyright (c) 2013 Sanders DeNardi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.