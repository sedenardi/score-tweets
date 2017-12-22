'use strict';

const Hole = function(hole) {
  this.Hole = hole.Hole;
  this.Strokes = hole.Strokes;
  this.Par = hole.Par;
};

Hole.parse = function(raw) {
  return new Hole({
    Hole: raw.course_hole_id,
    Strokes: raw.strokes,
    Par: raw.par
  });
};

Hole.prototype.isFinished = function() {
  return this.Strokes !== null;
};

Hole.prototype.scoreChanged = function(otherHole) {
  return !otherHole || this.Strokes !== otherHole.Strokes;
};

Hole.prototype.scoreType = function() {
  const diff = this.Strokes - this.Par;
  if (isNaN(diff)) {
    return null;
  }
  switch (diff) {
    case -3: return 'an albatross';
    case -2: return 'an eagle';
    case -1: return 'a birdie';
    case 0: return 'par';
    case 1: return 'a bogey';
    case 2: return 'a double bogey';
    case 3: return 'a triple bogey';
    case 4: return 'a quadruple bogey';
    default: return ('+' + diff.toString());
  }
};

module.exports = Hole;
