CREATE TABLE IF NOT EXISTS `nflteams` (
  `TeamID` tinyint(4) NOT NULL,
  `Name` varchar(50) NOT NULL,
  `City` varchar(50) NOT NULL,
  `DisplayName` varchar(50) NOT NULL,
  `TwitterAccount` varchar(50) DEFAULT NULL,
  `TwitterHashtag` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`TeamID`),
  KEY `IX_NFLTeams` (`Name`)
) ENGINE=InnoDB;

INSERT INTO `nflteams` (`TeamID`, `Name`, `City`, `DisplayName`, `TwitterAccount`, `TwitterHashtag`) VALUES
	(1, 'Bills', 'Buffalo', 'BUF', '@buffalobills', '#Bills'),
	(2, 'Dolphins', 'Miami', 'MIA', '@MiamiDolphins', '#Dolphins'),
	(3, 'Patriots', 'New England', 'NE', '@Patriots', '#Patriots'),
	(4, 'Jets', 'New York', 'NYJ', '@nyjets', '#Jets'),
	(5, 'Ravens', 'Baltimore', 'BAL', '@Ravens', '#Ravens'),
	(6, 'Bengals', 'Cincinnati', 'CIN', '@Bengals', '#Bengals'),
	(7, 'Browns', 'Cleveland', 'CLE', '@Browns', '#Browns'),
	(8, 'Steelers', 'Pittsburgh', 'PIT', '@Steelers', '#Steelers'),
	(9, 'Texans', 'Houston', 'HOU', '@HoustonTexans', '#Texans'),
	(10, 'Colts', 'Indianapolis', 'IND', '@Colts', '#Colts'),
	(11, 'Jaguars', 'Jacksonville', 'JAC', '@jaguars', '#Jaguars'),
	(12, 'Titans', 'Tennessee', 'TEN', '@TennesseeTitans', '#Titans'),
	(13, 'Broncos', 'Denver', 'DEN', '@Broncos', '#Broncos'),
	(14, 'Chiefs', 'Kansas City', 'KC', '@KCChiefs', '#Chiefs'),
	(15, 'Raiders', 'Oakland', 'OAK', '@Raiders', '#Raiders'),
	(16, 'Chargers', 'San Diego', 'SD', '@Chargers', '#Chargers'),
	(17, 'Cowboys', 'Dallas', 'DAL', '@dallascowboys', '#Cowboys'),
	(18, 'Giants', 'New York', 'NYG', '@Giants', '#Giants'),
	(19, 'Eagles', 'Philadelphia', 'PHI', '@Eagles', '#Eagles'),
	(20, 'Redskins', 'Washington', 'WAS', '@Redskins', '#Redskins'),
	(21, 'Bears', 'Chicago', 'CHI', '@ChicagoBears', '#Bears'),
	(22, 'Lions', 'Detroit', 'DET', '@DetroitLionsNFL', '#Lions'),
	(23, 'Packers', 'Green Bay', 'GB', '@Packers', '#Packers'),
	(24, 'Vikings', 'Minnesota', 'MIN', '@Vikings', '#Vikings'),
	(25, 'Falcons', 'Atlanta', 'ATL', '@Atlanta_Falcons', '#Falcons'),
	(26, 'Panthers', 'Carolina', 'CAR', '@Panthers', '#Panthers'),
	(27, 'Saints', 'New Orleans', 'NO', '@Saints', '#Saints'),
	(28, 'Buccaneers', 'Tampa Bay', 'TB', '@TBBuccaneers', '#Bucs'),
	(29, 'Cardinals', 'Arizona', 'ARI', '@AZCardinals', '#Cardinals'),
	(30, 'Rams', 'St. Louis', 'STL', '@STLouisRams', '#Rams'),
	(31, '49ers', 'San Francisco', 'SF', '@49ers', '#49ers'),
	(32, 'Seahawks', 'Seattle', 'SEA', '@Seahawks', '#Seahawks');

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
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `nflstates` (
  `StateID` tinyint(4) NOT NULL,
  `State` varchar(50) NOT NULL,
  PRIMARY KEY (`StateID`),
  KEY `IX_NFLStates` (`State`)
) ENGINE=InnoDB;

INSERT INTO `nflstates` (`StateID`, `State`) VALUES
	(5, 'Final'),
	(4, 'Overtime'),
	(3, 'Halftime'),
	(2, 'Progress'),
	(1, 'Scheduled');

CREATE TABLE IF NOT EXISTS `nflgameinstances` (
  `InstanceID` INT(11) NOT NULL AUTO_INCREMENT,
  `GameID` INT(11) NOT NULL,
  `StateID` TINYINT(4) NOT NULL,
  `Time` VARCHAR(50) NOT NULL,
  `Quarter` VARCHAR(50) NOT NULL,
  `AwayScore` TINYINT(4) NOT NULL,
  `HomeScore` TINYINT(4) NOT NULL,
  `RecordedOn` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`InstanceID`),
  INDEX `FK_NFLGameInstances_StateID` (`StateID`),
  INDEX `IX_NFLGameInstances_GameID_RecordedOn` (`GameID`, `RecordedOn`),
  CONSTRAINT `FK_NFLGameInstances_GameID` FOREIGN KEY (`GameID`) REFERENCES `nflgames` (`GameID`),
  CONSTRAINT `FK_NFLGameInstances_StateID` FOREIGN KEY (`StateID`) REFERENCES `nflstates` (`StateID`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `nfltweets` (
  `TweetID` int(11) NOT NULL AUTO_INCREMENT,
  `InstanceID` int(11) NOT NULL,
  `TweetString` varchar(200) NOT NULL,
  `TwitterID` varchar(50) NULL DEFAULT NULL,
  `RecordedOn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`TweetID`),
  UNIQUE KEY `UQ_NFLTweets_InstanceID` (`InstanceID`),
  CONSTRAINT `FK_NFLTweets_InstanceID` FOREIGN KEY (`InstanceID`) REFERENCES `nflgameinstances` (`InstanceID`)
) ENGINE=InnoDB;
