import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';

export class Cell {
	constructor(x, y, cube) {
		this.x = x;
		this.y = y;
		this.cube = cube;
		this.figure = null;
	}

	addToBoard(board) {
		this.cube.position.set(this.x, this.y, 0);
		board.add(this.cube);

		return this;
	}

	static createCube(scene, color) {
		const cube = new THREE.Group();
		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const baseMaterial = new THREE.MeshPhongMaterial({
			color: 0x000000,
			transparent: true,
			opacity: 0
		});
		const surfaceMaterial = new THREE.MeshPhongMaterial({
			color: color,
			transparent: true,
			opacity: 0.5,
			envMap: scene.background,
			// fog: false,
			// emissive: color,
			// emissiveIntensity: 1,
			// emissiveMap: scene.background,
		});
		const cubeSides = [
			baseMaterial,
			baseMaterial,
			baseMaterial,
			baseMaterial,
			surfaceMaterial,
			baseMaterial,
		];

		const cubeMesh = new THREE.Mesh(geometry, cubeSides);
		cube.add(cubeMesh);

		const linesGeometry = new LineSegmentsGeometry();
		linesGeometry.fromEdgesGeometry(new THREE.EdgesGeometry(geometry));
		const cubeEdges = new LineSegments2(linesGeometry, new LineMaterial({
			color: 0x7400A3,
			linewidth: 3,
			// emissive: 0x7400A3,
			// emissiveIntensity: 0.3,
			// emissiveMap: scene.background,
		}));
		cube.add(cubeEdges);

		return cube;
	}
}