CREATE TABLE IF NOT EXISTS `nhlgames` (
  `GameID` int(11) NOT NULL AUTO_INCREMENT,
  `GameSymbol` varchar(50) CHARACTER SET latin1 NOT NULL,
  `Date` date NOT NULL,
  `AwayTeamID` tinyint(4) NOT NULL,
  `HomeTeamID` tinyint(4) NOT NULL,
  `RecordedOn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`GameID`),
  KEY `IX_NHLGames_GameSymbol` (`GameSymbol`),
  KEY `FK_NHLGames_AwayTeamID` (`AwayTeamID`),
  KEY `FK_NHLGames_HomeTeamID` (`HomeTeamID`),
  CONSTRAINT `FK_NHLGames_AwayTeamID` FOREIGN KEY (`AwayTeamID`) REFERENCES `nhlteams` (`TeamID`),
  CONSTRAINT `FK_NHLGames_HomeTeamID` FOREIGN KEY (`HomeTeamID`) REFERENCES `nhlteams` (`TeamID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;