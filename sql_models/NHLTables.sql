CREATE TABLE IF NOT EXISTS `nhlteams` (
  `TeamID` tinyint(4) NOT NULL,
  `Name` varchar(50) NOT NULL,
  `City` varchar(50) NOT NULL,
  `DisplayName` varchar(50) NOT NULL,
  `TwitterAccount` varchar(50) DEFAULT NULL,
  `TwitterHashtag` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`TeamID`),
  KEY `IX_NHLTeams` (`Name`)
) ENGINE=InnoDB;

INSERT INTO `nhlteams` (`TeamID`, `Name`, `City`, `DisplayName`, `TwitterAccount`, `TwitterHashtag`) VALUES
	(1, 'Ducks', 'Anaheim', 'ANA', '@AnaheimDucks', '#NHLDucks'),
	(2, 'Flames', 'Calgary', 'CGY', '@NHLFlames', '#Flames'),
	(3, 'Oilers', 'Edmonton', 'EDM', '@EdmontonOilers', '#Oilers'),
	(4, 'Kings', 'Los Angeles', 'LOS', '@LAKings', '#LAKings'),
	(5, 'Coyotes', 'Phoenix', 'PHX', '@phoenixcoyotes', '#Coyotes'),
	(6, 'Sharks', 'San Jose', 'SJS', '@SanJoseSharks', '#SJSharks'),
	(7, 'Canucks', 'Vancouver', 'VAN', '@VanCanucks', '#Canucks'),
	(8, 'Blackhawks', 'Chicago', 'CHI', '@NHLBlackhawks', '#Blackhawks'),
	(9, 'Avalanche', 'Colorado', 'COL', '@Avalanche', '#Avs'),
	(10, 'Stars', 'Dallas', 'DAL', '@DallasStars', '#Stars'),
	(11, 'Wild', 'Minnesota', 'MIN', '@mnwild', '#mnwild'),
	(12, 'Predators', 'Nashville', 'NSH', '@PredsNH', '#Preds'),
	(13, 'Blues', 'St. Louis', 'STL', '@StLouisBlues', '#stlblues'),
	(14, 'Jets', 'Winnipeg', 'WIN', '@NHLJets', '#NHLJets'),
	(15, 'Bruins', 'Boston', 'BOS', '@NHLBruins', '#NHLBruins'),
	(16, 'Sabres', 'Buffalo', 'BUF', '@BuffaloSabres', '#Sabres'),
	(17, 'Red Wings', 'Detroit', 'DET', '@DetroitRedWings', '#RedWings'),
	(18, 'Panthers', 'Florida', 'FLA', '@FlaPanthers', '#FlaPanthers'),
	(19, 'Canadiens', 'Montréal', 'MTL', '@CanadiensMTL', '#Habs'),
	(20, 'Senators', 'Ottawa', 'OTT', '@Senators', '#Sens'),
	(21, 'Lightning', 'Tampa Bay', 'TAM', '@TBLightning', '#TBLightning'),
	(22, 'Maple Leafs', 'Toronto', 'TOR', '@MapleLeafs', '#Leafs'),
	(23, 'Hurricanes', 'Carolina', 'CAR', '@NHLCanes', '#Canes'),
	(24, 'Blue Jackets', 'Columbus', 'CLB', '@BlueJacketsNHL', '#CBJ'),
	(25, 'Devils', 'New Jersey', 'NJD', '@NHLDevils', '#NJDevils'),
	(26, 'Islanders', 'New York', 'NYI', '@NYIslanders', '#Isles'),
	(27, 'Rangers', 'New York', 'NYR', '@NYRangers', '#NYR'),
	(28, 'Flyers', 'Philadelphia', 'PHI', '@NHLFlyers', '#Flyers'),
	(29, 'Penguins', 'Pittsburgh', 'PIT', '@penguins', '#Pens'),
	(30, 'Capitals', 'Washington', 'WAS', '@washcaps', '#Caps');

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
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `nhlstates` (
  `StateID` tinyint(4) NOT NULL,
  `State` varchar(50) NOT NULL,
  PRIMARY KEY (`StateID`),
  KEY `IX_NHLStates` (`State`)
) ENGINE=InnoDB;

INSERT INTO `nhlstates` (`StateID`, `State`) VALUES
  (6, 'Final'),
  (3, 'Intermission'),
  (4, 'Overtime'),
  (2, 'Progress'),
  (1, 'Scheduled'),
  (5, 'Shootout');

CREATE TABLE IF NOT EXISTS `nhlgameinstances` (
  `InstanceID` INT(11) NOT NULL AUTO_INCREMENT,
  `GameID` INT(11) NOT NULL,
  `StateID` TINYINT(4) NOT NULL,
  `Time` VARCHAR(50) NOT NULL,
  `Period` VARCHAR(50) NOT NULL,
  `AwayScore` TINYINT(4) NOT NULL,
  `HomeScore` TINYINT(4) NOT NULL,
  `RecordedOn` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`InstanceID`),
  INDEX `FK_NHLGameInstances_StateID` (`StateID`),
  INDEX `IX_NHLGameInstances_GameID_RecordedOn` (`GameID`, `RecordedOn`),
  CONSTRAINT `FK_NHLGameInstances_GameID` FOREIGN KEY (`GameID`) REFERENCES `nhlgames` (`GameID`),
  CONSTRAINT `FK_NHLGameInstances_StateID` FOREIGN KEY (`StateID`) REFERENCES `nhlstates` (`StateID`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `nhltweets` (
  `TweetID` int(11) NOT NULL AUTO_INCREMENT,
  `InstanceID` int(11) NOT NULL,
  `TweetString` varchar(200) NOT NULL,
  `TwitterID` varchar(50) NULL DEFAULT NULL,
  `RecordedOn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`TweetID`),
  UNIQUE KEY `UQ_NHLTweets_InstanceID` (`InstanceID`),
  CONSTRAINT `FK_NHLTweets_InstanceID` FOREIGN KEY (`InstanceID`) REFERENCES `nhlgameinstances` (`InstanceID`)
) ENGINE=InnoDB;
