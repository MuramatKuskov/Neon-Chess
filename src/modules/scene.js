import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { canvas, renderer, render, requestRenderIfNotRequested } from './rendering.js';
import { Board } from '../models/Board.js';
import { loadModels } from '../utils/loadModels.js';
import { applyWireframe } from '../utils/applyWireframe.js';
import { getSettings } from "../utils/settings.js";

const figureModels = {
	red: new Map(),
	blue: new Map()
}
let scene, camera, controls, board;

function initScene() {
	const fov = 75;
	const aspect = canvas.width / canvas.height;
	const near = 0.1;
	const far = 22;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

	const scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0x777, 0.03);

	// light
	const color = 0xFFFFFF;
	const intensity = 3;
	const light = new THREE.DirectionalLight(color, intensity);
	light.position.set(-1, 2, 4);
	scene.add(light);

	// camera controls
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.enablePan = false;
	controls.minDistance = 1;
	controls.maxDistance = 15;

	controls.enableDamping = getSettings("cameraInertia");
	controls.dampingFactor = 0.1;

	controls.autoRotate = getSettings("cameraAutoRotate");

	controls.autoRotateSpeed = 0.5;

	camera.position.set(0, 0, 9);
	controls.update();
	controls.addEventListener('change', () => requestRenderIfNotRequested(scene, camera, controls));

	window.addEventListener('resize', () => requestRenderIfNotRequested(scene, camera, controls));

	return [scene, camera, controls];
}

async function setScene() {
	[scene, camera, controls] = initScene();
	board = new Board(scene).init();
	await loadModels(figureModels);

	applyWireframe(scene, figureModels.red);
	applyWireframe(scene, figureModels.blue);

	board.addFigures(figureModels);
	render(scene, camera, controls);
}

setScene();

export { scene, camera, controls, board, figureModels };