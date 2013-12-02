CREATE TABLE IF NOT EXISTS `nhlgameinstances` (
  `InstanceID` INT(11) NOT NULL AUTO_INCREMENT,
  `GameID` INT(11) NOT NULL,
  `StateID` TINYINT(4) NOT NULL,
  `Time` VARCHAR(50) NOT NULL,
  `Period` VARCHAR(50) NOT NULL,
  `AwayScore` TINYINT(4) NOT NULL,
  `HomeScore` TINYINT(4) NOT NULL,
  `RecordedOn` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `RawInstance` VARCHAR(1000) NOT NULL,
  PRIMARY KEY (`InstanceID`),
  INDEX `FK_NHLGameInstances_StateID` (`StateID`),
  INDEX `IX_NHLGameInstances_GameID_RecordedOn` (`GameID`, `RecordedOn`),
  CONSTRAINT `FK_NHLGameInstances_GameID` FOREIGN KEY (`GameID`) REFERENCES `nhlgames` (`GameID`),
  CONSTRAINT `FK_NHLGameInstances_StateID` FOREIGN KEY (`StateID`) REFERENCES `nhlstates` (`StateID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;