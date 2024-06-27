import { type Object3D, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { Axes } from '../object/axes.js';
import { EventEmitter } from '../util/event-emitter.js';

type Events = {
  debugChanged(debug: boolean): void;
  beforeRender(elapsedMs: number): void;
  afterRender(elapsedMs: number): void;
};

export interface GameOptions {
  readonly canvas: HTMLCanvasElement;
}

export interface GameStats {
  readonly fps: number;
  readonly triangles: number;
  readonly lines: number;
  readonly points: number;
  readonly calls: number;
  readonly frame: number;
  readonly timeMs: number;
}

const SAMPLE_COUNT = 10;

export class Game extends EventEmitter<Events> {
  readonly #renderer: WebGLRenderer;
  readonly #camera: PerspectiveCamera;
  readonly #scene: Scene;
  readonly #controls: OrbitControls;

  #width: number;
  #height: number;
  #pixelRatio: number;
  #debug = false;
  #characterName = 'character';
  #lastFrameTimestamp = 0;
  #sampleFramerates: number[] = [];

  get debug(): boolean {
    return this.#debug;
  }

  get characterName(): string {
    return this.#characterName;
  }

  constructor({ canvas }: GameOptions) {
    super();

    this.#width = canvas.clientWidth;
    this.#height = canvas.clientHeight;
    this.#pixelRatio = canvas.ownerDocument.defaultView?.devicePixelRatio ?? 1;
    this.#renderer = new WebGLRenderer({ antialias: true, canvas });
    this.#renderer.setPixelRatio(this.#pixelRatio);
    this.#renderer.setSize(this.#width, this.#height, false);
    this.#camera = new PerspectiveCamera(45, this.#width / this.#height, 0.1, 100);
    this.#camera.position.set(10, 10, 10);
    this.#camera.lookAt(0, 0, 0);
    this.#scene = new Scene();
    this.#scene.add(this.#camera);
    this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement);
  }

  pause(): void {
    this.#renderer.setAnimationLoop(null);
  }

  resume(): void {
    this.#renderer.setAnimationLoop(this.#render);
  }

  setDebug(debug: boolean): void {
    if (debug === this.#debug) return;

    this.#debug = debug;

    if (debug) {
      this.#scene.add(new Axes(this.#camera, 'DEBUG'));
    }
    else {
      this.#scene
        .getObjectsByProperty('name', 'DEBUG')
        .forEach((object) => this.#scene.remove(object));
    }

    this.emit('debugChanged', debug);
  }

  setCharacterName(name: string): void {
    this.#characterName = name;
  }

  addObject(object: Object3D): void {
    this.#scene.add(object);
  }

  getStats(): GameStats {
    return {
      fps: this.#sampleFramerates.length > 0
        ? Math.round(this.#sampleFramerates.reduce((a, b) => a + b, 0) / this.#sampleFramerates.length)
        : 0,
      triangles: this.#renderer.info.render.triangles,
      lines: this.#renderer.info.render.lines,
      points: this.#renderer.info.render.points,
      calls: this.#renderer.info.render.calls,
      frame: this.#renderer.info.render.frame,
      timeMs: this.#lastFrameTimestamp,
    };
  }

  #render = (elapsedMs: number): void => {
    const frameElapsedMs = Math.max(0, elapsedMs - this.#lastFrameTimestamp);

    this.#lastFrameTimestamp = elapsedMs;
    this.#sampleFramerates.push(1000 / frameElapsedMs);
    while (this.#sampleFramerates.length > SAMPLE_COUNT) this.#sampleFramerates.shift();

    this.#controls.update();
    this.#scene
      .getObjectsByProperty('name', 'DEBUG')
      .forEach((object: Object3D & { update?: () => void }) => object.update?.());
    this.emit('beforeRender', elapsedMs);
    this.#updateCamera();
    this.#updateViewport();
    this.#renderer.render(this.#scene, this.#camera);
    this.emit('afterRender', elapsedMs);
  };

  #updateCamera = (): void => {
    const character = this.#scene.getObjectByName(this.#characterName);

    if (character) {
      this.#camera.position.copy(character.position).add(new Vector3(10, 10, 10));
      this.#camera.lookAt(character.position);
    }
  };

  #updateViewport = (): void => {
    const canvas = this.#renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const pixelRatio = canvas.ownerDocument.defaultView?.devicePixelRatio ?? 1;

    if (width !== this.#width || height !== this.#height || pixelRatio !== this.#pixelRatio) {
      this.#width = width;
      this.#height = height;
      this.#pixelRatio = pixelRatio;
      this.#camera.aspect = this.#width / this.#height;
      this.#camera.updateProjectionMatrix();
      this.#renderer.setPixelRatio(this.#pixelRatio);
      this.#renderer.setSize(this.#width, this.#height, false);
    }
  };
}
