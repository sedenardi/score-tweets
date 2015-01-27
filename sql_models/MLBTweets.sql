CREATE TABLE IF NOT EXISTS `mlbtweets` (
  `TweetID` int(11) NOT NULL AUTO_INCREMENT,
  `InstanceID` int(11) NOT NULL,
  `TweetString` varchar(200) NOT NULL,
  `TwitterID` varchar(50) NULL DEFAULT NULL,
  `RecordedOn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`TweetID`),
  UNIQUE KEY `UQ_MLBTweets_InstanceID` (`InstanceID`),
  CONSTRAINT `FK_MLBTweets_InstanceID` FOREIGN KEY (`InstanceID`) REFERENCES `mlbgameinstances` (`InstanceID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;