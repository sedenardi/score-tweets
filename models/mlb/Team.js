'use strict';

const teamMap = {
  108: { Name: 'Angels', City: 'LA Angels' },
  109: { Name: 'D-backs', City: 'Arizona' },
  110: { Name: 'Orioles', City: 'Baltimore' },
  111: { Name: 'Red Sox', City: 'Boston' },
  112: { Name: 'Cubs', City: 'Chi Cubs' },
  113: { Name: 'Reds', City: 'Cincinnati' },
  114: { Name: 'Indians', City: 'Cleveland' },
  115: { Name: 'Rockies', City: 'Colorado' },
  116: { Name: 'Tigers', City: 'Detroit' },
  117: { Name: 'Astros', City: 'Houston' },
  118: { Name: 'Royals', City: 'Kansas City' },
  119: { Name: 'Dodgers', City: 'LA Dodgers' },
  120: { Name: 'Nationals', City: 'Washington' },
  121: { Name: 'Mets', City: 'NY Mets' },
  133: { Name: 'Athletics', City: 'Oakland' },
  134: { Name: 'Pirates', City: 'Pittsburgh' },
  135: { Name: 'Padres', City: 'San Diego' },
  136: { Name: 'Mariners', City: 'Seattle' },
  137: { Name: 'Giants', City: 'San Francisco' },
  138: { Name: 'Cardinals', City: 'St. Louis' },
  139: { Name: 'Rays', City: 'Tampa Bay' },
  140: { Name: 'Rangers', City: 'Texas' },
  141: { Name: 'Blue Jays', City: 'Toronto' },
  142: { Name: 'Twins', City: 'Minnesota' },
  143: { Name: 'Phillies', City: 'Philadelphia' },
  144: { Name: 'Braves', City: 'Atlanta' },
  145: { Name: 'White Sox', City: 'Chi White Sox' },
  146: { Name: 'Marlins', City: 'Miami' },
  147: { Name: 'Yankees', City: 'NY Yankees' },
  158: { Name: 'Brewers', City: 'Milwaukee' }
};

const Team = function(team) {
  this.Name = team.Name;
  this.City = team.City;
};

Team.parse = function(rawTeam) {
  if (!teamMap[rawTeam]) { return null; }
  return new Team(teamMap[rawTeam]);
};

module.exports = Team;
