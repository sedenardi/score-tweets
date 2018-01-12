'use strict';

class Instance {
  constructor(instance) {
    this.State = instance.State;
    this.Period = instance.Period;
    this.Time = instance.Time;
    this.HomeScore = instance.HomeScore;
    this.AwayScore = instance.AwayScore;
  }
  scoreChanged(prevInstance) {
    return (
      prevInstance.State !== this.State ||
      prevInstance.Period !== this.Period ||
      prevInstance.AwayScore !== this.AwayScore ||
      prevInstance.HomeScore !== this.HomeScore ||
      (
        prevInstance.State === 'Scheduled' &&
        this.State === 'Scheduled' &&
        prevInstance.Time !== this.Time &&
        this.Time && this.Time.length
      )
    );
  }
  changeString(prevInstance, game) {
    let str = '';
    const scores = game.AwayTeam.Name + ' ' + this.AwayScore + ', ' +
      game.HomeTeam.Name + ' ' + this.HomeScore + '. ';
    if (prevInstance.State !== this.State) {
      if (prevInstance.State === 'Scheduled' && this.State === 'Progress') {
        if (this.Period !== '1st') {
          return str;
        }
        str = 'Start of game: ' + game.AwayTeam.Name + ' vs ' + game.HomeTeam.Name;
      }
      if (this.State === 'Final') {
        if (this.Period === 'SO') {
          str = 'Final SO. ' + scores;
        } else if (this.Period === 'OT') {
          str = 'Final OT. ' + scores;
        } else {
          str = 'Final. ' + scores;
        }
      }
    } else {
      const isOT = (this.State === 'Overtime' || this.State === 'Shootout');
      if (prevInstance.AwayScore > this.AwayScore ||
        prevInstance.HomeScore > this.HomeScore) {
        str = 'Score Correction. ' + scores + this.Time + ' ' + this.Period;
      } else if (prevInstance.AwayScore !== this.AwayScore && !isOT) {
        if (this.AwayScore === this.HomeScore) {
          str = game.AwayTeam.Name + ' tie it up. ' + scores + this.Time + ' ' + this.Period;
        } else if (prevInstance.AwayScore <= prevInstance.HomeScore && this.AwayScore > this.HomeScore) {
          str = game.AwayTeam.Name + ' take the lead. ' + scores + this.Time + ' ' + this.Period;
        } else {
          str = game.AwayTeam.Name + ' score. ' + scores + this.Time + ' ' + this.Period;
        }
      } else if (prevInstance.HomeScore !== this.HomeScore && !isOT) {
        if (this.AwayScore === this.HomeScore) {
          str = game.HomeTeam.Name + ' tie it up. ' + scores + this.Time + ' ' + this.Period;
        } else if (prevInstance.HomeScore <= prevInstance.AwayScore &&
            this.HomeScore > this.AwayScore) {
          str = game.HomeTeam.Name + ' take the lead. ' + scores + this.Time + ' ' + this.Period;
        } else {
          str = game.HomeTeam.Name + ' score. ' + scores + this.Time + ' ' + this.Period;
        }
      }
    }
    return str ? (str.trim() + ' ' + game.makeGameLink()) : '';
  }
}

Instance.parse = function(raw) {
  const instanceObj = {
    HomeScore: (raw.hts === '' ? 0 : parseInt(raw.hts)),
    AwayScore: (raw.ats === '' ? 0 : parseInt(raw.ats))
  };
  switch (raw.gs.toString()) {
    case '1':
      instanceObj.State = 'Scheduled';
      instanceObj.Time = raw.bs;
      break;
    case '2':
      instanceObj.State = 'Scheduled';
      break;
    case '3':
      if (raw.ts.indexOf('END') !== -1) {
        instanceObj.State = 'Intermission';
      } else {
        instanceObj.State = 'Progress';
      }
      instanceObj.Time = raw.ts.split(' ')[0];
      instanceObj.Period = raw.ts.split(' ')[1];
      break;
    case '4':
      if (raw.ts.indexOf('SHOOTOUT') !== -1) {
        instanceObj.State = 'Shootout';
      } else {
        instanceObj.Time = raw.ts.split(' ')[0];
        instanceObj.Period = raw.ts.substring(raw.ts.indexOf(' ')+1);
        if (instanceObj.Period.indexOf('OT') !== -1) {
          instanceObj.State = 'Overtime';
        } else if (instanceObj.Period.indexOf('SO') !== -1) {
          instanceObj.State = 'Shootout';
        } else {
          instanceObj.State = 'Progress';
        }
      }
      break;
    case '5':
      instanceObj.State = 'Final';
      if (raw.bs.indexOf('OT') !== -1) {
        instanceObj.Period = 'OT';
      }
      if (raw.bs.indexOf('SO') !== -1) {
        instanceObj.Period = 'SO';
      }
      break;
  }
  return new Instance(instanceObj);
};

module.exports = Instance;
