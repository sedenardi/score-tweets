'use strict';

var teamMap = {
  ducks: { Name: 'Ducks', City: 'Anaheim' },
  flames: { Name: 'Flames', City: 'Calgary' },
  oilers: { Name: 'Oilers', City: 'Edmonton' },
  kings: { Name: 'Kings', City: 'Los Angeles' },
  coyotes: { Name: 'Coyotes', City: 'Phoenix' },
  sharks: { Name: 'Sharks', City: 'San Jose' },
  canucks: { Name: 'Canucks', City: 'Vancouver' },
  blackhawks: { Name: 'Blackhawks', City: 'Chicago' },
  avalanche: { Name: 'Avalanche', City: 'Colorado' },
  stars: { Name: 'Stars', City: 'Dallas' },
  wild: { Name: 'Wild', City: 'Minnesota' },
  predators: { Name: 'Predators', City: 'Nashville' },
  blues: { Name: 'Blues', City: 'St. Louis' },
  jets: { Name: 'Jets', City: 'Winnipeg' },
  bruins: { Name: 'Bruins', City: 'Boston' },
  sabres: { Name: 'Sabres', City: 'Buffalo' },
  redwings: { Name: 'Red Wings', City: 'Detroit' },
  panthers: { Name: 'Panthers', City: 'Florida' },
  canadiens: { Name: 'Canadiens', City: 'Montréal' },
  senators: { Name: 'Senators', City: 'Ottawa' },
  lightning: { Name: 'Lightning', City: 'Tampa Bay' },
  mapleleafs: { Name: 'Maple Leafs', City: 'Toronto' },
  hurricanes: { Name: 'Hurricanes', City: 'Carolina' },
  bluejackets: { Name: 'Blue Jackets', City: 'Columbus' },
  devils: { Name: 'Devils', City: 'New Jersey' },
  islanders: { Name: 'Islanders', City: 'New York' },
  rangers: { Name: 'Rangers', City: 'New York' },
  flyers: { Name: 'Flyers', City: 'Philadelphia' },
  penguins: { Name: 'Penguins', City: 'Pittsburgh' },
  capitals: { Name: 'Capitals', City: 'Washington' },
};

var Team = function(team) {
  this.Name = team.Name;
  this.City = team.City;
};

Team.parse = function(rawTeam) {
  return new Team(teamMap[rawTeam]);
};

module.exports = Team;
