import * as _ from 'lodash';
import * as pag from 'pag';
import * as ppe from 'ppe';
import * as sss from 'sss';
import * as gcc from 'gcc';
import * as s1 from './s1/index';
declare const require: any;
const RL = require('rl');
const Neuroevolution = require('Neuroevolution');
const isEnableGcc = false;
let ne;
let genCount = 0;

s1.init(init, initGame, update, postUpdate);

function init() {
  s1.screen.init(128, 128);
  s1.setTitle('DQN', 'CROSS ROAD');
  s1.setOptions({
    isShowingTitle: false,
    isShowingScore: false
  });
  s1.setSeeds(9009582);
  ne = new Neuroevolution({
    population: dqnCount / 2,
    network: [Dqn.sightLane * 2, [10, 10], 2]
  });
  if (isEnableGcc) {
    gcc.setOptions({ scale: 2 });
  }
}

const laneCount = 8;
const dqnCount = 10;
let aliveDqn;

function initGame() {
  _.times(16, i => {
    let edge = new Road(['xxxx']);
    edge.pos.x = i * 8 + 4;
    edge.pos.y = 14;
    edge = new Road(['xxxx']);
    edge.pos.x = i * 8 + 4;
    edge.pos.y = 110;
  });
  _.times(2, x => {
    _.times(7, y => {
      const line = new Road(['oooooo']);
      line.pos.x = x * 80 + 40;
      line.pos.y = 14 + 12 + y * 12;
    });
  });
}

function update() {
  if (s1.Actor.get('Dqn').length <= 0) {
    const gen = ne.nextGeneration();
    _.forEach(gen, g => new Dqn(g));
    let agentJSON;
    if (aliveDqn != null) {
      agentJSON = aliveDqn.agent.toJSON();
    }
    _.times(dqnCount / 2, () => {
      const d = new Dqn();
      if (agentJSON != null) {
        d.agent.fromJSON(agentJSON);
      }
    });
    sortDqns();
    genCount++;
  }
  if (s1.ticks % (60 * 2) == 60 * 2 - 1) {
    sortDqns(true);
  }
  if (s1.ticks % 20 === 0) {
    new Car();
  }
}

function postUpdate() {
  drawDqnRewards();
  const gs = `GEN${genCount}`;
  s1.text.draw(gs, s1.screen.size.x - gs.length * 4 - 4, 4);
  if (isEnableGcc) {
    gcc.capture(s1.screen.canvas);
  }
}

class Dqn extends s1.Actor {
  static hueIndex = 0;
  static sightLane = 3;
  lane = laneCount + 1;
  agent;
  totalReward = 0;
  isHit = false;
  isFirst = true;
  index = 0;
  outOfLaneTicks = 0;
  isDqn = true;

  constructor(public gen = null) {
    super();
    this.isDqn = gen == null;
    if (this.isDqn) {
      const env: any = {};
      env.getNumStates = () => Dqn.sightLane * 2;
      env.getMaxNumActions = () => 3;
      this.agent = new RL.DQNAgent(env, {});
    }
    this.pixels = pag.generate([' x', 'xxx', 'x x'],
      { isMirrorY: false, hue: Dqn.hueIndex * 0.15 + (this.isDqn ? 0 : 0.5) });
    this.pos.x = s1.screen.size.x / 2;
    Dqn.hueIndex += 0.11;
    if (Dqn.hueIndex >= 1) {
      Dqn.hueIndex--;
    }
    this.pos.y = this.lane * 12 + 8;
  }

  update() {
    if (getNearestCarDist(this.lane) < 5) {
      this.isHit = true;
    }
    this.pos.y += (this.lane * 12 + 8 - this.pos.y) * 0.2;
    super.update();
    if (s1.ticks % 8 > 0) {
      return;
    }
    let reward = 0;
    if (this.isHit) {
      reward -= 5;
      this.emitParticles('e1');
      sss.play('e1');
      this.lane = laneCount + 1;
      this.outOfLaneTicks = 0;
      this.isHit = false;
    } else if (this.lane < 1) {
      reward++;
      sss.play('c1');
      this.lane = laneCount + 1;
      this.outOfLaneTicks = 0;
    }
    if (!this.isFirst) {
      if (this.isDqn) {
        this.agent.learn(reward);
      }
      this.totalReward += reward;
    } else {
      this.isFirst = false;
    }
    const state = _.times(Dqn.sightLane, i => {
      const l = this.lane + i - (Dqn.sightLane - 1) / 2;
      const type = l < 1 ? 1 : (l > laneCount) ? 0 : 0.5;
      return [getNearestCarDist(l) / 64, type];
    });
    let action = 0;
    if (this.isDqn) {
      action = this.agent.act(_.flatten(state));
    } else {
      const res = this.gen.compute(_.flatten(state));
      action = res[0] > 0.5 ? 0 : res[1] > 0.5 ? 2 : 1;
    }
    const prevLane = this.lane;
    this.lane += action - 1;
    if (this.lane > laneCount) {
      if (prevLane <= laneCount) {
        this.lane = laneCount;
      } else {
        this.lane = laneCount + 1;
        this.outOfLaneTicks++;
        if (this.outOfLaneTicks > 6) {
          this.lane = laneCount;
        }
      }
    }
  }
}

function sortDqns(isElminating = false) {
  const dqns = _.sortBy(s1.Actor.get('Dqn'), 'totalReward');
  if (isElminating) {
    const ed = dqns[0] as Dqn;
    ed.emitParticles('e2', 2);
    sss.play('e2');
    if (!ed.isDqn) {
      ne.networkScore(ed.gen, ed.totalReward);
    }
    ed.remove();
    dqns.shift();
  }
  _.forEach(dqns, (d: Dqn, i) => {
    d.index = i;
    d.priority = 10 - i;
    if (d.isDqn) {
      aliveDqn = d;
    }
  });
}

function drawDqnRewards() {
  _.forEach(s1.Actor.get('Dqn'), (d: Dqn) => {
    const ry = d.index * 10 + 10;
    d.drawPixels(8, ry);
    s1.text.draw(`${d.totalReward}`, 15, ry - 2);
  });
}

class Car extends s1.Actor {
  lane: number;
  ticks = 0;
  dist = 999;

  constructor() {
    super();
    this.lane = Math.floor(s1.p.random(1, laneCount + 1));
    this.pixels = pag.generate(['x x', 'xxx'],
      { seed: this.lane, hue: 0.2 + getLaneSpeed(this.lane) * 0.1 });
    this.angle = this.lane % 2 * s1.p.PI;
    this.pos.y = this.lane * 12 + 8;
    sss.play(`l${this.lane}`);
  }

  update() {
    let x: number;
    const speed = getLaneSpeed(this.lane);
    if (this.angle === 0) {
      x = this.ticks * speed;
      if (x > s1.screen.size.x) {
        this.remove();
      }
    } else {
      x = s1.screen.size.x - this.ticks * speed;
      if (x < 0) {
        this.remove();
      }
    }
    this.dist = s1.screen.size.x / 2 - x;
    if (this.angle > 0) {
      this.dist *= -1;
    }
    if (this.dist < 0) {
      this.dist = 999;
    }
    this.pos.x = x;
    super.update();
  }
}

function getLaneSpeed(lane: number) {
  return (lane >= 1 && lane <= laneCount) ? (lane + 1) % 3 + 1 : 0;
}

function getCars(lane: number) {
  return _.filter(s1.Actor.get('Car'), (c: Car) => c.lane === lane) as Car[];
}

function getCarsFromNearest(lane: number) {
  return _.sortBy(getCars(lane), 'dist');
}

function getNearestCarDist(lane: number) {
  const cars = getCarsFromNearest(lane);
  return cars.length > 0 ? cars[0].dist : 999;
}

class Road extends s1.Actor {
  constructor(patterns) {
    super();
    this.pixels = pag.generate(patterns, { isMirrorY: false, seed: 1 });
  }
}
