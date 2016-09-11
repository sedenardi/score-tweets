'use strict';

const teamMap = {
  DEN: { Name: 'Broncos', City: 'Denver'},
  CAR: { Name: 'Panthers', City: 'Carolina'},
  ATL: { Name: 'Falcons', City: 'Atlanta'},
  TB: { Name: 'Buccaneers', City: 'Tampa Bay'},
  BAL: { Name: 'Ravens', City: 'Baltimore'},
  BUF: { Name: 'Bills', City: 'Buffalo'},
  HOU: { Name: 'Texans', City: 'Houston'},
  CHI: { Name: 'Bears', City: 'Chicago'},
  JAC: { Name: 'Jaguars', City: 'Jacksonville'},
  GB: { Name: 'Packers', City: 'Green Bay'},
  KC: { Name: 'Chiefs', City: 'Kansas City'},
  SD: { Name: 'Chargers', City: 'San Diego'},
  NO: { Name: 'Saints', City: 'New Orleans'},
  OAK: { Name: 'Raiders', City: 'Oakland'},
  NYJ: { Name: 'Jets', City: 'New York'},
  CIN: { Name: 'Bengals', City: 'Cincinnati'},
  PHI: { Name: 'Eagles', City: 'Philadelphia'},
  CLE: { Name: 'Browns', City: 'Cleveland'},
  TEN: { Name: 'Titans', City: 'Tennessee'},
  MIN: { Name: 'Vikings', City: 'Minnesota'},
  SEA: { Name: 'Seahawks', City: 'Seattle'},
  MIA: { Name: 'Dolphins', City: 'Miami'},
  DAL: { Name: 'Cowboys', City: 'Dallas'},
  NYG: { Name: 'Giants', City: 'New York'},
  IND: { Name: 'Colts', City: 'Indianapolis'},
  DET: { Name: 'Lions', City: 'Detroit'},
  ARI: { Name: 'Cardinals', City: 'Arizona'},
  NE: { Name: 'Patriots', City: 'New England'},
  WAS: { Name: 'Redskins', City: 'Washington'},
  PIT: { Name: 'Steelers', City: 'Pittsburgh'},
  SF: { Name: '49ers', City: 'San Francisco'},
  LA: { Name: 'Rams', City: 'Los Angeles'}
};

class Team {
  constructor(team) {
    this.Name = team.Name;
    this.City = team.City;
  }
}

Team.parse = function(rawTeam) {
  return new Team(teamMap[rawTeam]);
};

module.exports = Team;
