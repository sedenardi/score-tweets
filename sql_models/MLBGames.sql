CREATE TABLE IF NOT EXISTS `mlbgames` (
  `GameID` int(11) NOT NULL AUTO_INCREMENT,
  `GameSymbol` varchar(50) NOT NULL,
  `DateTime` timestamp NULL DEFAULT NULL,
  `AwayTeamID` smallint(6) NOT NULL,
  `HomeTeamID` smallint(6) NOT NULL,
  `RecordedOn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`GameID`),
  KEY `IX_MLBGames_GameSymbol` (`GameSymbol`),
  KEY `FK_MLBGames_AwayTeamID` (`AwayTeamID`),
  KEY `FK_MLBGames_HomeTeamID` (`HomeTeamID`),
  CONSTRAINT `FK_MLBGames_AwayTeamID` FOREIGN KEY (`AwayTeamID`) REFERENCES `mlbteams` (`TeamID`),
  CONSTRAINT `FK_MLBGames_HomeTeamID` FOREIGN KEY (`HomeTeamID`) REFERENCES `mlbteams` (`TeamID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;