import * as _ from 'lodash';
import * as ppe from 'ppe';
import * as sss from 'sss';
import * as s1 from './s1/index';
declare const require: any;
const RL = require('rl');

s1.init(init, initGame, update);

function init() {
  s1.screen.init(128, 128);
  s1.setTitle('DQN', 'CROSS ROAD');
  //s1.setSeeds(7589781);
  s1.enableDebug(() => {
  });
}

function initGame() {
  new Dqn();
}

function update() {
}

class Dqn extends s1.Actor {
  agent;

  constructor() {
    super();
    const env: any = {};
    env.getNumStates = () => 3;
    env.getMaxNumActions = () => 3;
    this.agent = new RL.DQNAgent(env, {});
  }

  update() {
    this.agent.act([0, 0, 0]);
    this.agent.learn(0);
  }
}
