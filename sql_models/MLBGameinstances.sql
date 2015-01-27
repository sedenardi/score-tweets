CREATE TABLE IF NOT EXISTS `mlbgameinstances` (
  `InstanceID` int(11) NOT NULL AUTO_INCREMENT,
  `GameID` int(11) NOT NULL,
  `State` varchar(50) NOT NULL,
  `Inning` tinyint(4) NOT NULL,
  `TopInning` bit(1) NOT NULL,
  `AwayScore` tinyint(4) NOT NULL,
  `HomeScore` tinyint(4) NOT NULL,
  `RecordedOn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`InstanceID`),
  KEY `IX_MLBGameInstances_GameID_RecordedOn` (`GameID`,`RecordedOn`),
  CONSTRAINT `FK_MLBGameInstances_GameID` FOREIGN KEY (`GameID`) REFERENCES `mlbgames` (`GameID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;