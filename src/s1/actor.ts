import * as _ from 'lodash';
import * as pag from 'pag';
import * as ir from 'ir';
import * as s1 from './index';
import * as screen from './screen';

let p5;
let p: p5;
const rotationNum = 16;

export default class Actor {
  pos: p5.Vector = new p5.Vector();
  vel: p5.Vector = new p5.Vector();
  angle = 0;
  speed = 0;
  isAlive = true;
  priority = 1;
  ticks = 0;
  pixels: pag.Pixel[][][];
  type: string;
  collision: p5.Vector = new p5.Vector();
  context: CanvasRenderingContext2D = screen.context;
  replayPropertyNames: string[];

  constructor() {
    Actor.add(this);
    this.type = ('' + this.constructor).replace(/^\s*function\s*([^\(]*)[\S\s]+$/im, '$1');
  }

  update() {
    this.pos.add(this.vel);
    this.pos.x += Math.cos(this.angle) * this.speed;
    this.pos.y += Math.sin(this.angle) * this.speed;
    if (this.pixels != null) {
      this.drawPixels();
    }
    this.ticks++;
  }

  remove() {
    this.isAlive = false;
  }

  testCollision(type: string) {
    return _.filter<Actor>(Actor.get(type), a =>
      p.abs(this.pos.x - a.pos.x) < (this.collision.x + a.collision.x) / 2 &&
      p.abs(this.pos.y - a.pos.y) < (this.collision.y + a.collision.y) / 2
    );
  }

  drawPixels() {
    let a = this.angle;
    if (a < 0) {
      a = Math.PI * 2 - Math.abs(a % (Math.PI * 2));
    }
    const pxs: pag.Pixel[][] =
      this.pixels[Math.round(a / (Math.PI * 2 / rotationNum)) % rotationNum];
    const pw = pxs.length;
    const ph = pxs[0].length;
    const sbx = Math.floor(this.pos.x - pw / 2);
    const sby = Math.floor(this.pos.y - ph / 2);
    for (let y = 0, sy = sby; y < ph; y++ , sy++) {
      for (let x = 0, sx = sbx; x < pw; x++ , sx++) {
        var px = pxs[x][y];
        if (!px.isEmpty) {
          this.context.fillStyle = px.style;
          this.context.fillRect(sx, sy, 1, 1);
        }
      }
    }
  }

  getReplayStatus() {
    if (this.replayPropertyNames == null) {
      return null;
    }
    return ir.objectToArray(this, this.replayPropertyNames);
  }

  setReplayStatus(status) {
    ir.arrayToObject(status, this.replayPropertyNames, this);
  }

  static actors: any[];

  static init() {
    p5 = s1.p5;
    p = s1.p;
    pag.defaultOptions.isMirrorY = true;
    pag.defaultOptions.rotationNum = rotationNum;
    pag.defaultOptions.scale = 2;
    Actor.clear();
  }

  static add(actor) {
    Actor.actors.push(actor);
  }

  static clear() {
    Actor.actors = [];
  }

  static update() {
    Actor.actors.sort((a, b) => a.priority - b.priority);
    _.forEach(Actor.actors, a => {
      a.update();
    });
    for (let i = 0; i < Actor.actors.length;) {
      if (Actor.actors[i].isAlive === false) {
        Actor.actors.splice(i, 1);
      } else {
        i++;
      }
    }
  }

  static generatePixels(pattern: string[], options = {}): pag.Pixel[][][] {
    return pag.generate(pattern, options);
  }

  static get(type: string) {
    return _.filter<Actor>(Actor.actors, a => a.type === type);
  }

  static getReplayStatus() {
    let status = [];
    _.forEach(Actor.actors, (a: Actor) => {
      let array = a.getReplayStatus();
      if (array != null) {
        status.push([a.type, array]);
      }
    });
    return status;
  }

  static setReplayStatus(status: any[], actorGeneratorFunc) {
    _.forEach(status, s => {
      actorGeneratorFunc(s[0], s[1]);
    });
  }
}
