import { AxesHelper, type Camera, type LineBasicMaterial, Vector3 } from 'three';

import { TextLabel } from './text-label.js';

export class Axes extends AxesHelper {
  readonly #camera: Camera;

  constructor(camera: Camera, name = '') {
    super(2);

    this.#camera = camera;
    this.name = name;

    const material = this.material as LineBasicMaterial;
    const y = new TextLabel('Y', 8, 'sans-serif', '#8f4', 'rgba(0, 0, 0, 0.33)');
    const x = new TextLabel('X', 8, 'sans-serif', '#da2', 'rgba(0, 0, 0, 0.33)');
    const z = new TextLabel('Z', 8, 'sans-serif', '#48f', 'rgba(0, 0, 0, 0.33)');

    material.depthTest = false;
    material.fog = false;
    y.position.y = 2;
    x.position.x = 2;
    z.position.z = 2;

    this.add(y);
    this.add(x);
    this.add(z);
  }

  update(): void {
    this.position.copy(this.#camera.position).add(new Vector3(0, 0, -25).applyQuaternion(this.#camera.quaternion));
  }
}
