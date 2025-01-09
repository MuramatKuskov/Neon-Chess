import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

export function loadModelFromFile(scene, model, playerModelCache) {
	return new Promise((resolve, reject) => {
		const path = './models/' + model + '.glb';

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