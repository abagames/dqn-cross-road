import * as sss from 'sss';
import * as s1 from './index';

let p5;
export let cursorPos: p5.Vector;
export let isPressing = false;
export let isPressed = false;
let canvas: HTMLCanvasElement;
let pixelSize: p5.Vector;
let currentTargetPos: p5.Vector;
let prevCursorPos: p5.Vector;
let targetPos: p5.Vector;
let intTargetPos: p5.Vector;

export function init(_canvas: HTMLCanvasElement, _pixelSize: p5.Vector) {
  canvas = _canvas;
  pixelSize = _pixelSize;
  document.onmousedown = (e) => {
    onMouseTouchDown(e.pageX, e.pageY);
  };
  document.ontouchstart = (e) => {
    onMouseTouchDown(e.touches[0].pageX, e.touches[0].pageY);
  };
  document.onmousemove = (e) => {
    onMouseTouchMove(e.pageX, e.pageY);
  };
  document.ontouchmove = (e) => {
    e.preventDefault();
    onMouseTouchMove(e.touches[0].pageX, e.touches[0].pageY);
  };
  document.onmouseup = (e) => {
    onMouseTouchUp(e);
  };
  document.ontouchend = (e) => {
    onMouseTouchUp(e);
  };
  p5 = s1.p5;
  cursorPos = new p5.Vector();
  targetPos = new p5.Vector();
  currentTargetPos = new p5.Vector();
  prevCursorPos = new p5.Vector();
  intTargetPos = new p5.Vector();
}

export function setCurrentTargetPos(_currentTargetPos: p5.Vector) {
  currentTargetPos = _currentTargetPos;
}

export function getTargetPos() {
  return intTargetPos;
}

export function resetPressed() {
  isPressed = false;
}

export function getReplayEvents() {
  freezeTargetPos();
  const tp = getTargetPos();
  return [tp.x, tp.y];
}

export function setReplayEvents(events) {
  intTargetPos.x = events[0];
  intTargetPos.y = events[1];
}

function freezeTargetPos() {
  intTargetPos.set(Math.round(targetPos.x), Math.round(targetPos.y));
}

function onMouseTouchDown(x, y) {
  calcCursorPos(x, y, cursorPos);
  targetPos.set(currentTargetPos != null ? currentTargetPos : cursorPos);
  prevCursorPos.set(cursorPos);
  sss.playEmpty();
  isPressing = isPressed = true;
}

function onMouseTouchMove(x, y) {
  calcCursorPos(x, y, cursorPos);
  if (isPressing) {
    prevCursorPos.sub(cursorPos);
    targetPos.sub(prevCursorPos);
  } else {
    targetPos.set(cursorPos);
  }
  prevCursorPos.set(cursorPos);
}

function calcCursorPos(x, y, v) {
  v.set(
    ((x - canvas.offsetLeft) / canvas.clientWidth + 0.5) * pixelSize.x,
    ((y - canvas.offsetTop) / canvas.clientHeight + 0.5) * pixelSize.y
  );
}

function onMouseTouchUp(e) {
  isPressing = false;
}
