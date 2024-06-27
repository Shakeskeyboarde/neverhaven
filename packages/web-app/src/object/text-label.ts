import { CanvasTexture, LinearFilter, Sprite, SpriteMaterial } from 'three';

export class TextLabel extends Sprite {
  #canvas: HTMLCanvasElement;
  #context: CanvasRenderingContext2D;
  #texture: CanvasTexture;
  #material: SpriteMaterial;
  #text = '';
  #fontSize: number;
  #fontFamily: string;
  #color: string;
  #backgroundColor: string;

  constructor(text: string, fontSize = 8, fontFamily = 'sans-serif', color = 'white', backgroundColor = 'rgba(0, 0, 0, 0.33)') {
    const c = document.createElement('canvas');
    const t = new CanvasTexture(c);
    const m = new SpriteMaterial({ map: t, sizeAttenuation: false });

    super(m);

    this.#text = text;
    this.#fontSize = fontSize;
    this.#fontFamily = fontFamily;
    this.#color = color;
    this.#backgroundColor = backgroundColor;

    this.#canvas = c;
    this.#canvas.width = 256 * window.devicePixelRatio;
    this.#canvas.height = 64 * window.devicePixelRatio;

    this.#context = c.getContext('2d')!;
    this.#context.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.#context.font = `${this.#fontSize}px ${this.#fontFamily}`;
    this.#context.textBaseline = 'top';

    this.#texture = t;
    this.#texture.minFilter = LinearFilter;

    this.#material = m;
    this.#material.depthTest = false;
    this.#material.fog = false;

    this.#update();
  }

  setText(value: string): void {
    this.#text = value;
    this.#update();
  }

  #update(): void {
    const width = Math.min(this.#canvas.width, this.#context.measureText(this.#text).width + 6);
    const height = Math.min(this.#canvas.height, this.#fontSize + 4);
    this.#context.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
    this.#context.fillStyle = this.#backgroundColor;
    this.#context.roundRect(0, 0, width, height, 2);
    this.#context.fill();
    this.#context.fillStyle = this.#color;
    this.#context.fillText(this.#text, 3, 3);
    this.#texture.repeat.set(width / 256, (height / 64));
    this.#texture.offset.set(0, 1 - (height / 64));
    this.#texture.needsUpdate = true;
    this.scale.set(
      width * 0.001,
      height * 0.001,
      0,
    );
  }
}
