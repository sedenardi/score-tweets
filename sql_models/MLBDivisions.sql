CREATE TABLE IF NOT EXISTS `mlbdivisions` (
  `DivisionID` tinyint(4) NOT NULL,
  `Division` varchar(20) NOT NULL,
  PRIMARY KEY (`DivisionID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `mlbdivisions` (`DivisionID`, `Division`) VALUES
  (2, 'AL Central'),
  (1, 'AL East'),
  (3, 'AL West'),
  (4, 'NL East'),
  (5, 'NL Central'),
  (6, 'NL West');