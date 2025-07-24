import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

// move files to server
export function loadModelFromFile(model, playerModelCache) {
	return new Promise((resolve, reject) => {
		const path = '/models/' + model + '.glb';

		loader.load(path, function (gltf) {
			gltf.scene.scale.set(0.6, 0.6, 0.6);
			gltf.scene.rotation.x = Math.PI / 2;
			gltf.scene.children[0].userData.isFigure = true;
			playerModelCache.set(model, gltf.scene);

			resolve();
		}, undefined, function (error) {
			reject(error);
		});
	});
}

export function loadModels(modelCache) {
	const models = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
	const promises = models.map(async model => {
		await loadModelFromFile(model, modelCache.red);
		await loadModelFromFile(model, modelCache.blue);
	});
	return Promise.all(promises);
}