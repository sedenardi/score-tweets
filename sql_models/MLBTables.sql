CREATE TABLE IF NOT EXISTS `mlbdivisions` (
  `DivisionID` tinyint(4) NOT NULL,
  `Division` varchar(20) NOT NULL,
  PRIMARY KEY (`DivisionID`)
) ENGINE=InnoDB;

INSERT INTO `mlbdivisions` (`DivisionID`, `Division`) VALUES
  (2, 'AL Central'),
  (1, 'AL East'),
  (3, 'AL West'),
  (4, 'NL East'),
  (5, 'NL Central'),
  (6, 'NL West');

CREATE TABLE IF NOT EXISTS `mlbteams` (
  `TeamID` smallint(6) NOT NULL,
  `DivisionID` tinyint(4) NOT NULL,
  `Name` varchar(50) NOT NULL,
  `City` varchar(50) NOT NULL,
  `DisplayName` varchar(50) NOT NULL,
  `TwitterAccount` varchar(50) DEFAULT NULL,
  `TwitterHashtag` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`TeamID`),
  KEY `IX_MLBTeams` (`Name`),
  KEY `FK_MLBTeams_Division` (`DivisionID`),
  CONSTRAINT `FK_MLBTeams_Division` FOREIGN KEY (`DivisionID`) REFERENCES `mlbdivisions` (`DivisionID`)
) ENGINE=InnoDB;

INSERT INTO `mlbteams` (`TeamID`, `DivisionID`, `Name`, `City`, `DisplayName`, `TwitterAccount`, `TwitterHashtag`) VALUES
  (134, 5, 'Pirates', 'Pittsburgh', 'PIT', NULL, NULL),
  (116, 2, 'Tigers', 'Detroit', 'DET', NULL, NULL),
  (142, 2, 'Twins', 'Minnesota', 'MIN', NULL, NULL),
  (135, 6, 'Padres', 'San Diego', 'SD', NULL, NULL),
  (115, 6, 'Rockies', 'Colorado', 'COL', NULL, NULL),
  (141, 1, 'Blue Jays', 'Toronto', 'TOR', NULL, NULL),
  (117, 3, 'Astros', 'Houston', 'HOU', NULL, NULL),
  (140, 3, 'Rangers', 'Texas', 'TEX', NULL, NULL),
  (114, 2, 'Indians', 'Cleveland', 'CLE', NULL, NULL),
  (109, 6, 'D-backs', 'Arizona', 'ARI', NULL, NULL),
  (158, 5, 'Brewers', 'Milwaukee', 'MIL', NULL, NULL),
  (133, 3, 'Athletics', 'Oakland', 'OAK', NULL, NULL),
  (143, 4, 'Phillies', 'Philadelphia', 'PHI', NULL, NULL),
  (112, 5, 'Cubs', 'Chi Cubs', 'CHC', NULL, NULL),
  (138, 5, 'Cardinals', 'St. Louis', 'STL', NULL, NULL),
  (145, 2, 'White Sox', 'Chi White Sox', 'CWS', NULL, NULL),
  (119, 6, 'Dodgers', 'LA Dodgers', 'LAD', NULL, NULL),
  (137, 6, 'Giants', 'San Francisco', 'SF', NULL, NULL),
  (111, 1, 'Red Sox', 'Boston', 'BOS', NULL, NULL),
  (120, 4, 'Nationals', 'Washington', 'WSH', NULL, NULL),
  (146, 4, 'Marlins', 'Miami', 'MIA', NULL, NULL),
  (136, 3, 'Mariners', 'Seattle', 'SEA', NULL, NULL),
  (110, 1, 'Orioles', 'Baltimore', 'BAL', NULL, NULL),
  (121, 4, 'Mets', 'NY Mets', 'NYM', NULL, NULL),
  (147, 1, 'Yankees', 'NY Yankees', 'NYY', NULL, NULL),
  (139, 1, 'Rays', 'Tampa Bay', 'TB', NULL, NULL),
  (144, 4, 'Braves', 'Atlanta', 'ATL', NULL, NULL),
  (118, 2, 'Royals', 'Kansas City', 'KC', NULL, NULL),
  (113, 5, 'Reds', 'Cincinnati', 'CIN', NULL, NULL),
  (108, 3, 'Angels', 'LA Angels', 'LAA', NULL, NULL);

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mlbtweets` (
  `TweetID` int(11) NOT NULL AUTO_INCREMENT,
  `InstanceID` int(11) NOT NULL,
  `TweetString` varchar(200) NOT NULL,
  `TwitterID` varchar(50) NULL DEFAULT NULL,
  `RecordedOn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`TweetID`),
  UNIQUE KEY `UQ_MLBTweets_InstanceID` (`InstanceID`),
  CONSTRAINT `FK_MLBTweets_InstanceID` FOREIGN KEY (`InstanceID`) REFERENCES `mlbgameinstances` (`InstanceID`)
) ENGINE=InnoDB;
