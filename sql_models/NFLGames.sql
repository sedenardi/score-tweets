CREATE TABLE IF NOT EXISTS `nflgames` (
  `GameID` int(11) NOT NULL AUTO_INCREMENT,
  `GameSymbol` varchar(50) NOT NULL,
  `Date` date NOT NULL,
  `SeasonYear` varchar(50) NOT NULL,
  `SeasonType` varchar(50) NOT NULL,
  `SeasonWeek` varchar(50) NOT NULL,
  `AwayTeamID` tinyint(4) NOT NULL,
  `HomeTeamID` tinyint(4) NOT NULL,
  `RecordedOn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`GameID`),
  KEY `IX_NFLGames_GameSymbol` (`GameSymbol`),
  KEY `FK_NFLGames_AwayTeamID` (`AwayTeamID`),
  KEY `FK_NFLGames_HomeTeamID` (`HomeTeamID`),
  CONSTRAINT `FK_NFLGames_AwayTeamID` FOREIGN KEY (`AwayTeamID`) REFERENCES `nflteams` (`TeamID`),
  CONSTRAINT `FK_NFLGames_HomeTeamID` FOREIGN KEY (`HomeTeamID`) REFERENCES `nflteams` (`TeamID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;