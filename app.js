import * as THREE from "three";
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = window.c;
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
const loader = new GLTFLoader();
const modelCache = new Map();

let renderRequested = false;

function main() {
	function renderCallback() {
		render(0, scene, camera, controls);
	}

	const [scene, camera, controls] = initScene();

	addBoard(scene);

	addFigures(scene, renderCallback);

	render(0, scene, camera, controls);
	// requestAnimationFrame(time => render(time, scene, camera, controls));
}

main();

function initScene() {
	const fov = 75;
	const aspect = canvas.width / canvas.height;
	const near = 0.1;
	const far = 17;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

	const scene = new THREE.Scene();

	// light
	const color = 0xFFFFFF;
	const intensity = 3;
	const light = new THREE.DirectionalLight(color, intensity);
	light.position.set(-1, 2, 4);
	scene.add(light);

	const controls = new OrbitControls(camera, renderer.domElement);
	controls.enablePan = false;
	controls.minDistance = 1;
	controls.maxDistance = 12;

	controls.enableDamping = true;
	controls.dampingFactor = 0.1;

	// controls.autoRotate = true;
	// controls.autoRotateSpeed = 4.0;

	camera.position.set(0, 0, 9);
	controls.update();
	controls.addEventListener('change', () => requestRenderIfNotRequested(scene, camera, controls));

	return [scene, camera, controls];
}

function addBoard(scene) {
	// Add group to scene
	const playBoardGroup = new THREE.Group();
	scene.add(playBoardGroup);
	scene.userData.playBoard = playBoardGroup;

	const size = 8;
	const cells = [];

	// Draw board
	for (let i = 0; i < size; i++) {
		const row = [];
		for (let j = 0; j < size; j++) {
			const cube = addCube(scene, i, j);
			row.push(cube);
		}
		cells.push(row);
	}

	scene.userData.playBoard.userData.cells = cells;
	scene.userData.playBoard.rotation.x = -1;
}

function addCube(scene, x, y) {
	const cubeGroup = new THREE.Group();

	const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
	const cubeMaterials = [
		new THREE.MeshPhongMaterial({ color: 0x000000, transparent: true, opacity: 0.3, refractionRatio: 0.9 }),	// front
		new THREE.MeshPhongMaterial({ color: 0x000000, transparent: true, opacity: 0.3, refractionRatio: 0.9 }), // back
		new THREE.MeshPhongMaterial({ color: 0x000000, transparent: true, opacity: 0.3, refractionRatio: 0.9 }), // top
		new THREE.MeshPhongMaterial({ color: 0x000000, transparent: true, opacity: 0.3, refractionRatio: 0.9 }), // bottom
		// right
		new THREE.MeshPhongMaterial({
			color: (x + y) % 2 === 0 ? 0x222299 : 0x992222,
			transparent: true,
			opacity: 0.3,
			envMap: scene.background,
			refractionRatio: 0.9
		}),
		new THREE.MeshPhongMaterial({ color: 0x000000, transparent: true, opacity: 0.7, refractionRatio: 0.9 }), // left
	];
	const cubeSides = new THREE.Mesh(cubeGeometry, cubeMaterials);
	cubeGroup.add(cubeSides);

	const linesGeometry = new LineSegmentsGeometry();
	linesGeometry.fromEdgesGeometry(new THREE.EdgesGeometry(cubeGeometry));
	const cubeEdges = new LineSegments2(linesGeometry, new LineMaterial({ color: 0x7400A3, linewidth: 2 }));
	cubeGroup.add(cubeEdges);

	cubeGroup.position.x = x - 3.5;
	cubeGroup.position.y = y - 3.5;
	scene.userData.playBoard.add(cubeGroup);

	return cubeGroup;
}

function addFigures(scene, callback) {
	const blue = 0x2200AA;
	const red = 0x881011;

	addPawns(scene, blue, red, callback);
	addRooks(scene, blue, red, callback);
	addKnights(scene, blue, red, callback);
	addBishops(scene, blue, red, callback);
	addQueens(scene, blue, red, callback);
	addKings(scene, blue, red, callback);
}

function addPawns(scene, blue, red, callback) {
	for (let i = 0; i < 8; i++) {
		addModel(scene, 'pawn.glb', i - 3.5, 2.5, Math.PI * 2, blue, callback);
		addModel(scene, 'pawn.glb', i - 3.5, -2.5, Math.PI, red, callback);
	}
}

function addRooks(scene, blue, red, callback) {
	addModel(scene, 'rook.glb', -3.5, 3.5, 0, blue, callback);
	addModel(scene, 'rook.glb', 3.5, 3.5, 0, blue, callback);
	addModel(scene, 'rook.glb', -3.5, -3.5, Math.PI, red, callback);
	addModel(scene, 'rook.glb', 3.5, -3.5, Math.PI, red, callback);
}

function addKnights(scene, blue, red, callback) {
	addModel(scene, 'knight.glb', -2.5, 3.5, 0, blue, callback);
	addModel(scene, 'knight.glb', 2.5, 3.5, 0, blue, callback);
	addModel(scene, 'knight.glb', -2.5, -3.5, Math.PI, red, callback);
	addModel(scene, 'knight.glb', 2.5, -3.5, Math.PI, red, callback);
}

function addBishops(scene, blue, red, callback) {
	addModel(scene, 'bishop.glb', -1.5, 3.5, 0, blue, callback);
	addModel(scene, 'bishop.glb', 1.5, 3.5, 0, blue, callback);
	addModel(scene, 'bishop.glb', -1.5, -3.5, Math.PI, red, callback);
	addModel(scene, 'bishop.glb', 1.5, -3.5, Math.PI, red, callback);
}

function addQueens(scene, blue, red, callback) {
	addModel(scene, 'queen.glb', 0.5, 3.5, 0, blue, callback);
	addModel(scene, 'queen.glb', 0.5, -3.5, Math.PI, red, callback);
}

function addKings(scene, blue, red, callback) {
	addModel(scene, 'king.glb', -0.5, 3.5, 0, blue, callback);
	addModel(scene, 'king.glb', -0.5, -3.5, Math.PI, red, callback);
}

function addModel(scene, model, x, y, rotation, color, renderCallBack) {
	const basePath = './public/models/';

	if (modelCache.has(model)) {
		const cachedModel = modelCache.get(model).clone();
		cachedModel.position.set(x, y, 1.1);
		cachedModel.rotation.x = Math.PI / 2;
		cachedModel.rotation.y = rotation;
		scene.userData.playBoard.add(cachedModel);
	} else {
		loader.load(basePath + model, function (gltf) {
			gltf.scene.scale.set(0.6, 0.6, 0.6);
			modelCache.set(basePath + model, gltf.scene.clone());
			gltf.scene.position.set(x, y, 0.9);
			gltf.scene.rotation.x = Math.PI / 2;
			gltf.scene.rotation.y = rotation;

			const wireframeMaterial = new THREE.MeshPhongMaterial({ wireframe: true, color: color, /* transparent: true, opacity: 0.5, */ reflectivity: 0.3 });

			// Create wireframe for the loaded model and hide the original model
			gltf.scene.traverse(function (child) {
				if (child.isMesh) {
					child.material = wireframeMaterial;
				}
			});

			scene.userData.playBoard.add(gltf.scene);
			renderCallBack()
		}, undefined, function (error) {
			console.error(error);
		});
	}
}

function render(time, scene, camera, controls) {
	time *= 0.001;  // convert time to seconds
	renderRequested = false;

	if (resizeRendererToDisplaySize(renderer)) {
		camera.aspect = canvas.clientWidth / canvas.clientHeight;
		camera.updateProjectionMatrix();
	}

	controls.update();
	renderer.render(scene, camera);

	// requestAnimationFrame(time => render(time, scene, camera, controls));
}

function requestRenderIfNotRequested(scene, camera, controls) {
	if (!renderRequested) {
		renderRequested = true;
		requestAnimationFrame(time => render(time, scene, camera, controls));
	}
}

function resizeRendererToDisplaySize(renderer) {
	const width = canvas.clientWidth;
	const height = canvas.clientHeight;
	/*
	const pixelRatio = window.devicePixelRatio;
	const width  = Math.floor(canvas.clientWidth * pixelRatio);
	const height = Math.floor(canvas.clientHeight * pixelRatio);
	*/
	const needResize = canvas.width !== width || canvas.height !== height;
	if (needResize) {
		renderer.setSize(width, height, false);
	}
	return needResize;
}