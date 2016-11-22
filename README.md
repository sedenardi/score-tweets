score-tweets
============

score-tweets is a framework for sending out live score updates via Twitter. This pings different leagues' sites to get score information, detect changes in score, then tweet out the score.

score-tweets runs on the AWS Lambda environment in response to scheduled events, and stores each league's scores in a AWS DynamoDB

NHL: [NHLTweetZone](https://twitter.com/NHLTweetZone)
MLB: [MLBTweetZone](https://twitter.com/MLBTweetZone)
NFL: [NFLTweetZone](https://twitter.com/NFLTweetZone)

### index.js
The AWS Lambda handler.

### runner.js
Main league runner to fetch, compare, send out, and store scores.

### leagues/
Configs for each leagues which contains the URL and model location for the league.

### models/
Models for each league that contain parsing and comparing methods.

### lib/dynamo.js
Promise wrapper for AWS DynamoDB calls.

### lib/request.js
Promise wrapper for the request library.

### lib/twitter.js
Promise wrapper for the twitter library, adds retrying if Twitter throttles us.

### lib/ordinal.js
Creates ordinal strings out of numbers (for innings and such).

### init.js
Sets up AWS DynamoDB tables.

## License

The MIT License (MIT)

Copyright (c) 2016 Sanders DeNardi

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
