import * as pag from 'pag';
import * as ppe from 'ppe';
import * as sss from 'sss';
import * as ir from 'ir';

import Actor from './actor';
import Random from './random';
import * as ui from './ui';
import * as screen from './screen';
import * as text from './text';
import * as debug from './debug';
export { default as Actor } from './actor';
export { default as Random } from './random';
export { ui, screen, text, debug };

declare const require: any;
export const p5 = require('p5');
export let p: p5;
export let createVector: (x?: number, y?: number, z?: number) => p5.Vector;
export let ticks = 0;
export let score = 0;
export let random: Random;
export let scene: Scene;

let initFunc: Function;
let initGameFunc: Function;
let updateFunc: Function;
let onSeedChangedFunc: Function;
let actorGeneratorFunc: Function;
let getReplayStatusFunc: Function;
let setReplayStatusFunc: Function;
let title: string = 'N/A';
let titleCont: string;
let isDebugEnabled = false;

export enum Scene {
  title, game, gameover, replay
};

export function init
  (_initFunc: () => void, _initGameFunc: () => void, _updateFunc: () => void) {
  initFunc = _initFunc;
  initGameFunc = _initGameFunc;
  updateFunc = _updateFunc;
  random = new Random();
  sss.init();
  new p5(_p => {
    p = _p;
    createVector = p.createVector;
    p.setup = setup;
    p.draw = draw;
  });
}

export function setTitle(_title: string, _titleCont: string = null) {
  title = _title;
  titleCont = _titleCont;
}

export function setReplayFuncs(
  _actorGeneratorFunc: (type: string, status: any) => void,
  _getReplayStatusFunc: () => any = null,
  _setReplayStatusFunc: (status: any) => void = null) {
  actorGeneratorFunc = _actorGeneratorFunc;
  getReplayStatusFunc = _getReplayStatusFunc;
  setReplayStatusFunc = _setReplayStatusFunc;
}

export function enableDebug(_onSeedChangedFunc = null) {
  onSeedChangedFunc = _onSeedChangedFunc;
  debug.initSeedUi(setSeeds);
  debug.enableShowingErrors();
  isDebugEnabled = true;
}

export function setSeeds(seed: number) {
  pag.setSeed(seed);
  ppe.setSeed(seed);
  ppe.reset();
  sss.reset();
  sss.setSeed(seed);
  if (scene === Scene.game) {
    sss.playBgm();
  }
  if (onSeedChangedFunc != null) {
    onSeedChangedFunc();
  }
}

export function endGame() {
  if (scene === Scene.gameover) {
    return;
  }
  let isReplay = scene === Scene.replay;
  scene = Scene.gameover;
  ticks = 0;
  sss.stopBgm();
  if (!isReplay) {
    ir.saveAsUrl();
  }
}

export function addScore(v: number) {
  if (scene === Scene.game || scene === Scene.replay) {
    score += v;
  }
}

function setup() {
  Actor.init();
  initFunc();
  ui.init(screen.canvas, screen.size);
  if (isDebugEnabled) {
    beginGame();
  } else {
    if (ir.loadFromUrl() === true) {
      beginReplay();
    } else {
      beginTitle();
      initGameFunc();
    }
  }
}

function beginGame() {
  scene = Scene.game;
  score = ticks = 0;
  sss.playBgm();
  ir.startRecord();
  Actor.clear();
  initGameFunc();
}

function beginTitle() {
  scene = Scene.title;
  ticks = 0;
}

function beginReplay() {
  const status = ir.startReplay();
  if (status !== false) {
    scene = Scene.replay;
    Actor.clear();
    initGameFunc();
    setStatus(status);
  }
}

function draw() {
  screen.clear();
  handleScene();
  sss.update();
  updateFunc();
  ppe.update();
  Actor.update();
  text.draw(`${score}`, 1, 1);
  drawSceneText();
  ticks++;
}

function handleScene() {
  if (scene !== Scene.game && ui.isPressed) {
    beginGame();
  }
  ui.resetPressed();
  if (scene === Scene.game) {
    ir.record(getStatus(), ui.getReplayEvents());
  }
  if (scene === Scene.gameover && ticks === 60) {
    beginTitle();
  }
  if (scene === Scene.title && ticks === 120) {
    beginReplay();
  }
  if (scene === Scene.replay) {
    const events = ir.getEvents();
    if (events !== false) {
      ui.setReplayEvents(events);
    } else {
      beginTitle();
    }
  }
}

function drawSceneText() {
  switch (scene) {
    case Scene.title:
      if (titleCont == null) {
        text.draw(title, screen.size.x / 2, screen.size.y * 0.48, true);
      } else {
        text.draw(title, screen.size.x / 2, screen.size.y * 0.4, true);
        text.draw(titleCont, screen.size.x / 2, screen.size.y * 0.48, true);
      }
      break;
    case Scene.gameover:
      text.draw('GAME OVER', screen.size.x / 2, screen.size.y * 0.45, true);
      break;
    case Scene.replay:
      text.draw('REPLAY', screen.size.x / 2, screen.size.y * 0.55, true);
      break;
  }
}

function getStatus() {
  const status = [ticks, score, random.getStatus(), Actor.getReplayStatus()];
  if (getReplayStatusFunc != null) {
    status.push(getReplayStatusFunc());
  }
  return status;
}

function setStatus(status) {
  Actor.setReplayStatus(status[3], actorGeneratorFunc);
  if (setReplayStatusFunc != null) {
    setReplayStatusFunc(status[4]);
  }
  ticks = status[0];
  score = status[1];
  random.setStatus(status[2]);
}
