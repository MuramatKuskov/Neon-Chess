import * as THREE from 'three';

export function applyWireframe(scene, playerCache) {
	const wireframeMaterial = new THREE.MeshPhongMaterial({
		wireframe: true,
		color: 0x000000,
		reflectivity: 1,
		// emissive: 0x000000,
		// emissiveIntensity: 0.05,
		// emissiveMap: scene.background
	});

	playerCache.forEach(model => model.children[0].material = wireframeMaterial);
}