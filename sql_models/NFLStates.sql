CREATE TABLE IF NOT EXISTS `NFLstates` (
  `StateID` tinyint(4) NOT NULL,
  `State` varchar(50) NOT NULL,
  PRIMARY KEY (`StateID`),
  KEY `IX_NFLStates` (`State`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `NFLstates` (`StateID`, `State`) VALUES
	(4, 'Ended'),
	(3, 'Halftime'),
	(2, 'Progress'),
	(1, 'Scheduled');