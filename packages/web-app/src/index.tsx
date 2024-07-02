import { createRoot } from 'react-dom/client';
import { BoxGeometry, Mesh, MeshNormalMaterial } from 'three';

import { App } from './app/app.jsx';
import { Renderer } from './renderer/renderer.js';
import { GameState } from './state/state.js';

const header = document.getElementById('header')!;
const root = document.getElementById('root')!;
const canvas = document.getElementById('game-content') as HTMLCanvasElement;
const renderer = new Renderer({ canvas });
const state = new GameState();
const cube = new Mesh(new BoxGeometry(1, 1, 1), new MeshNormalMaterial());

cube.name = 'cube';
renderer.setDebug(true);
renderer.addObject(cube);
renderer.resume();

createRoot(root).render(<App renderer={renderer} state={state} header={header} />);
