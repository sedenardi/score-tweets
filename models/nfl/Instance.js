'use strict';

const ordinal = require('../../lib/ordinal');

class Instance {
  constructor(instance) {
    this.State = instance.State;
    this.Quarter = instance.Quarter;
    this.Time = instance.Time;
    this.HomeScore = instance.HomeScore;
    this.AwayScore = instance.AwayScore;
  }
  timeNum() {
    return parseInt(this.Time.replace(/\D/g, ''));
  }
  scoreChanged(prevInstance) {
    return prevInstance.State !== this.State ||
      prevInstance.Quarter !== this.Quarter ||
      prevInstance.HomeScore !== this.HomeScore ||
      prevInstance.AwayScore !== this.AwayScore;
  }
  changeString(prevInstance, game) {
    let str = '';
    const scores = game.AwayTeam.Name + ' ' + this.AwayScore + ', ' +
      game.HomeTeam.Name + ' ' + this.HomeScore + '. ';
    const leadString = ' take the lead. ';
    const time = `${this.Time} ${ordinal(this.Quarter)} quarter.`;
    if (this.State !== prevInstance.State) {
      if (prevInstance.State === 'Pregame' && this.State === 'Progress') {
        str = `Start of game: ${game.AwayTeam.Name} vs ${game.HomeTeam.Name}`;
      }
      if (this.State === 'Final') {
        str = `Final${(prevInstance.Quarter === 'OT' ? ' OT' : '')}. ${scores}`;
      }
    } else if ((this.Quarter === prevInstance.Quarter && prevInstance.timeNum() >= this.timeNum()) || (prevInstance.Quarter < this.Quarter)) {
      if (prevInstance.AwayScore > this.AwayScore || prevInstance.HomeScore > this.HomeScore) {
        str = `Score correction. ${scores} ${time}`;
      } else if (prevInstance.AwayScore === prevInstance.HomeScore) {
        if (this.AwayScore > this.HomeScore) {
          str = game.AwayTeam.Name + leadString + scores + time;
        } else if (this.HomeScore > this.AwayScore){
          str = game.HomeTeam.Name + leadString + scores + time;
        }
      } else if (this.AwayScore === this.HomeScore) {
        if (prevInstance.AwayScore < prevInstance.HomeScore) {
          str = game.AwayTeam.Name + ' tie it up. ' + scores + time;
        } else if (prevInstance.HomeScore < prevInstance.AwayScore) {
          str = game.HomeTeam.Name + ' tie it up. ' + scores + time;
        }
      } else if (prevInstance.AwayScore < prevInstance.HomeScore && this.HomeScore < this.AwayScore) {
        str = game.AwayTeam.Name + leadString + scores + time;
      } else if (prevInstance.HomeScore < prevInstance.AwayScore && this.AwayScore < this.HomeScore) {
        str = game.HomeTeam.Name + leadString + scores + time;
      }
    }
    return str ? (str.trim() + ' ' + game.makeGameLink()) : '';
  }
}

Instance.parse = function(raw) {
  const instanceObj = {
    Time: raw.clock,
    HomeScore: raw.home.score.T,
    AwayScore: raw.away.score.T
  };
  if (!raw.qtr) {
    instanceObj.State = 'Pregame';
  } else if (!isNaN(parseInt(raw.qtr))) {
    instanceObj.State = 'Progress';
    instanceObj.Quarter = parseInt(raw.qtr) > 4 ? 'OT' : parseInt(raw.qtr);
  } else if (raw.qtr.toLocaleLowerCase().indexOf('final') !== -1) {
    instanceObj.State = 'Final';
  } else {
    instanceObj.State = raw.qtr;
  }

  return new Instance(instanceObj);
};

module.exports = Instance;
