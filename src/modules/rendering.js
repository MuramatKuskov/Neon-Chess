import * as THREE from 'three';

export const canvas = window.c;
export const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
let renderRequested = false;

export function render(scene, camera, controls) {
	renderRequested = false;

	if (resizeRendererToDisplaySize(renderer)) {
		camera.aspect = canvas.clientWidth / canvas.clientHeight;
		camera.updateProjectionMatrix();
	}

	controls.update();
	renderer.render(scene, camera);
}

export function requestRenderIfNotRequested(scene, camera, controls) {
	if (!renderRequested) {
		renderRequested = true;
		requestAnimationFrame(time => render(scene, camera, controls));
	}
}

export function resizeRendererToDisplaySize(renderer) {
	const pixelRatio = window.devicePixelRatio;
	const width = Math.floor(canvas.clientWidth * pixelRatio);
	const height = Math.floor(canvas.clientHeight * pixelRatio);

	const needResize = canvas.width !== width || canvas.height !== height;
	if (needResize) {
		renderer.setSize(width, height, false);
	}
	return needResize;
}