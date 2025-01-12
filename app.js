import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Board } from './src/models/Board.js';
import { loadModelFromFile } from './src/utils/loadModelFromFile.js';

const canvas = window.c;
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

const figureModels = {
	playerOne: new Map(),
	playerTwo: new Map()
};

const redModelColor = 0x881011;
const blueModelColor = 0x2200AA;

let renderRequested = false;
let selectedFigure = null;

async function main() {
	const [scene, camera, controls] = initScene();
	initUI(scene, camera, controls);

	const board = new Board(scene);
	board.init();

	await loadModels(scene);
	applyWireframe(scene, figureModels.playerOne);
	applyWireframe(scene, figureModels.playerTwo);
	board.addFigures(figureModels, redModelColor, blueModelColor);

	render(scene, camera, controls);
}

main();

function loadModels(scene) {
	const models = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
	const promises = models.map(async model => {
		await loadModelFromFile(scene, model, figureModels.playerOne);
		await loadModelFromFile(scene, model, figureModels.playerTwo);
	});
	return Promise.all(promises);
}

function applyWireframe(scene, playerCache) {
	const wireframeMaterial = new THREE.MeshPhongMaterial({
		wireframe: true,
		color: 0x000000,
		reflectivity: 1,
		emissive: 0x000000,
		emissiveIntensity: 0.05,
		emissiveMap: scene.background
	});

	playerCache.forEach(model => model.children[0].material = wireframeMaterial);
}

function initScene() {
	const fov = 75;
	const aspect = canvas.width / canvas.height;
	const near = 0.1;
	const far = 17;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

	const scene = new THREE.Scene();
	// scene.fog = new THREE.FogExp2(0x550055, 0.05);
	scene.fog = new THREE.FogExp2(0x777, 0.03);

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

	controls.autoRotate = true;
	controls.autoRotateSpeed = 0.5;

	camera.position.set(0, 0, 9);
	controls.update();
	controls.addEventListener('change', () => requestRenderIfNotRequested(scene, camera, controls));

	window.addEventListener('resize', () => requestRenderIfNotRequested(scene, camera, controls));

	return [scene, camera, controls];
}

function initUI(scene, camera, controls) {
	const resetButton = document.getElementById('reset-camera-button');
	resetButton.onclick = () => {
		camera.position.set(0, 0, 9);
		controls.update();
		requestRenderIfNotRequested(scene, camera, controls);
	};

	const settingsIcon = document.getElementById('settings-icon');
	const settingsPopup = document.getElementById('settings-popup');
	settingsIcon.onclick = () => {
		settingsPopup.style.display = settingsPopup.style.display === 'none' ? 'block' : 'none';
	};

	const highlightToggle = document.getElementById('highlight-toggle');
	highlightToggle.onchange = () => {
		scene.userData.playBoard.highlightEnabled = highlightToggle.checked;
		if (!highlightToggle.checked) {
			scene.userData.playBoard.clearHighlights();
			requestRenderIfNotRequested(scene, camera, controls);
		}
	};

	canvas.addEventListener('click', (event) => onCanvasClick(event, scene, camera, controls));
	// window.addEventListener('touchstart', (event) => {
	// 	// prevent the window from scrolling
	// 	event.preventDefault();
	// 	setPickPosition(event.touches[0]);
	// }, { passive: false });

	// window.addEventListener('touchmove', (event) => {
	// 	setPickPosition(event.touches[0]);
	// });

	// window.addEventListener('touchend', clearPickPosition);
}

function onCanvasClick(event, scene, camera, controls) {
	controls.autoRotateSpeed = 0.1;
	const mouse = new THREE.Vector2();
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

	const raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(mouse, camera);

	const intersects = raycaster.intersectObjects(scene.userData.playBoard.board.children, true);

	if (intersects.length > 0) {
		const intersectedObject = intersects[0].object;

		console.log(intersectedObject);

		// figure can move to selected cell
		if (selectedFigure && selectedFigure.userData.maintainingObject.move(intersectedObject.parent.userData.maintainingObject)) {
			scene.userData.playBoard.clearHighlights();
			requestRenderIfNotRequested(scene, camera, controls);
			selectedFigure = null;
		} else if (selectedFigure && intersectedObject.userData.isFigure) {
			// select another figure
			scene.userData.playBoard.clearHighlights();
			selectedFigure = intersectedObject.parent;
			scene.userData.playBoard.highlightAvailableMoves(selectedFigure.userData.maintainingObject);
			render(scene, camera, controls);
		} else if (intersectedObject.userData.isFigure) {
			// select figure
			selectedFigure = intersectedObject.parent;
			scene.userData.playBoard.highlightAvailableMoves(selectedFigure.userData.maintainingObject);
			render(scene, camera, controls);
		}
	} else if (selectedFigure) {
		// drop selection
		scene.userData.playBoard.clearHighlights();
		render(scene, camera, controls);
		selectedFigure = null;
	}
}

function render(scene, camera, controls) {
	renderRequested = false;

	if (resizeRendererToDisplaySize(renderer)) {
		camera.aspect = canvas.clientWidth / canvas.clientHeight;
		camera.updateProjectionMatrix();
	}

	controls.update();
	renderer.render(scene, camera);
}

function requestRenderIfNotRequested(scene, camera, controls) {
	if (!renderRequested) {
		renderRequested = true;
		requestAnimationFrame(time => render(scene, camera, controls));
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