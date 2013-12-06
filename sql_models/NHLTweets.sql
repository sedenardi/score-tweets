CREATE TABLE IF NOT EXISTS `nhltweets` (
  `TweetID` int(11) NOT NULL AUTO_INCREMENT,
  `InstanceID` int(11) NOT NULL,
  `TweetString` varchar(200) NOT NULL,
  `TwitterID` varchar(50) NULL DEFAULT NULL,
  `RecordedOn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`TweetID`),
  UNIQUE KEY `UQ_NHLTweets_InstanceID` (`InstanceID`),
  CONSTRAINT `FK_NHLTweets_InstanceID` FOREIGN KEY (`InstanceID`) REFERENCES `nhlgameinstances` (`InstanceID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;