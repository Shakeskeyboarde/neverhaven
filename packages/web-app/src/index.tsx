import { createRoot } from 'react-dom/client';
import { BoxGeometry, Mesh, MeshNormalMaterial } from 'three';

import { App } from './app/app.jsx';
import { Game } from './game/game.js';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const root = document.getElementById('root')!;
const game = new Game({ canvas });
const cube = new Mesh(new BoxGeometry(1, 1, 1), new MeshNormalMaterial());

cube.name = 'cube';
game.setDebug(true);
game.addObject(cube);
game.resume();

createRoot(root).render(<App game={game} />);
