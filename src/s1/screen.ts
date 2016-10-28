import * as ppe from 'ppe';
import * as s1 from './index';
import * as text from './text';

export let size: p5.Vector;
export let canvas: HTMLCanvasElement;
export let context: CanvasRenderingContext2D;

let p5;
let p: p5;
let backgroundColor;

export function init(x: number = 128, y: number = 128, _backgroundColor: any = 0) {
  p5 = s1.p5;
  p = s1.p;
  size = new p5.Vector(x, y);
  canvas = p.createCanvas(size.x, size.y).canvas;
  canvas.setAttribute('style', null);
  canvas.setAttribute('id', 'main');
  context = canvas.getContext('2d');
  ppe.options.canvas = canvas;
  text.init(context);
  backgroundColor = _backgroundColor;
}

export function clear() {
  p.background(backgroundColor);
}
