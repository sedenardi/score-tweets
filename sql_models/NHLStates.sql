CREATE TABLE IF NOT EXISTS `nhlstates` (
  `StateID` tinyint(4) NOT NULL,
  `State` varchar(50) NOT NULL,
  PRIMARY KEY (`StateID`),
  KEY `IX_NHLStates` (`State`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `nhlstates` (`StateID`, `State`) VALUES
	(6, 'Final'),
	(3, 'Intermission'),
	(4, 'Overtime'),
	(2, 'Progress'),
	(1, 'Scheduled'),
	(5, 'Shootout');