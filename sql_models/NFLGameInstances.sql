CREATE TABLE IF NOT EXISTS `nflgameinstances` (
  `InstanceID` INT(11) NOT NULL AUTO_INCREMENT,
  `GameID` INT(11) NOT NULL,
  `StateID` TINYINT(4) NOT NULL,
  `Time` VARCHAR(50) NOT NULL,
  `Quarter` VARCHAR(50) NOT NULL,
  `AwayScore` TINYINT(4) NOT NULL,
  `HomeScore` TINYINT(4) NOT NULL,
  `RecordedOn` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `RawInstance` VARCHAR(1000) NOT NULL,
  PRIMARY KEY (`InstanceID`),
  INDEX `FK_NFLGameInstances_StateID` (`StateID`),
  INDEX `IX_NFLGameInstances_GameID_RecordedOn` (`GameID`, `RecordedOn`),
  CONSTRAINT `FK_NFLGameInstances_GameID` FOREIGN KEY (`GameID`) REFERENCES `nflgames` (`GameID`),
  CONSTRAINT `FK_NFLGameInstances_StateID` FOREIGN KEY (`StateID`) REFERENCES `nflstates` (`StateID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;