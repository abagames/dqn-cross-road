import * as _ from 'lodash';
import * as pag from 'pag';
import * as ppe from 'ppe';
import * as sss from 'sss';
import * as s1 from './s1/index';
declare const require: any;
const RL = require('rl');

s1.init(init, initGame, update, postUpdate);

function init() {
  s1.screen.init(128, 128);
  s1.setTitle('DQN', 'CROSS ROAD');
  s1.setOptions({
    isShowingTitle: false,
    isShowingScore: false
  });
  s1.setSeeds(9009582);
  /*s1.enableDebug(() => {
  });*/
}

const laneCount = 8;
const dqnCount = 8;

function initGame() {
  _.times(dqnCount, () => new Dqn());
  sortDqns();
}

function update() {
  if (s1.ticks % (60 * 5) == 60 * 5 - 1) {
    const dqns = s1.Actor.get('Dqn');
    if (dqns.length > 1) {
      sortDqns(true);
    } else {
      const aliveDqn = dqns[0] as Dqn;
      aliveDqn.totalReward = 0;
      const agentJSON = aliveDqn.agent.toJSON();
      _.times(dqnCount - 1, () => {
        const d = new Dqn();
        d.agent.fromJSON(agentJSON);
      });
      sortDqns();
    }
  }
  if (s1.ticks % 20 === 0) {
    new Car();
  }
}

function postUpdate() {
  drawDqnRewards();
}

class Dqn extends s1.Actor {
  static hueIndex = 0;
  lane = laneCount + 1;
  agent;
  totalReward = 0;
  isHit = false;
  isFirst = true;
  index = 0;

  constructor() {
    super();
    const env: any = {};
    env.getNumStates = () => 3;
    env.getMaxNumActions = () => 3;
    this.agent = new RL.DQNAgent(env, {});
    this.pixels = pag.generate([' x', 'xxx', 'x x'],
      { isMirrorY: false, hue: Dqn.hueIndex });
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
      reward--;
      this.emitParticles('e1');
      sss.play('e1');
      this.lane = laneCount + 1;
      this.isHit = false;
    } else if (this.lane < 1) {
      reward++;
      sss.play('c1');
      this.lane = laneCount + 1;
    }
    if (!this.isFirst) {
      this.agent.learn(reward);
      this.totalReward += reward;
    } else {
      this.isFirst = false;
    }
    const state = _.times(3, i => getNearestCarDist(this.lane + i - 1));
    const action = this.agent.act(state);
    const prevLane = this.lane;
    this.lane += action - 1;
    if (this.lane > laneCount) {
      if (prevLane <= laneCount) {
        this.lane = laneCount;
      } else {
        this.lane = laneCount + 1;
      }
    }
  }
}

function sortDqns(isElminating = false) {
  const dqns = _.sortBy(s1.Actor.get('Dqn'), 'totalReward');
  if (isElminating) {
    const ed = dqns[0] as Dqn;
    ed.emitParticles('e2', 2);
    sss.play('u1');
    ed.remove();
    dqns.shift();
  }
  _.forEach(dqns, (d: Dqn, i) => {
    d.index = i;
    d.priority = 10 - i;
  });
}

function drawDqnRewards() {
  _.forEach(s1.Actor.get('Dqn'), (d: Dqn) => {
    const ry = d.index * 10 + 10;
    d.drawPixels(8, ry);
    s1.text.draw(`${d.totalReward}`, 20, ry);
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
      { seed: this.lane, hue: 0.2 + this.lane * 11 % 3 * 0.1 });
    this.angle = this.lane % 2 * s1.p.PI;
    this.pos.y = this.lane * 12 + 8;
    sss.play(`l${this.lane}`);
  }

  update() {
    let x: number;
    const speed = (this.lane * 11) % 3 + 1;
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
  constructor() {
    super();

  }
}