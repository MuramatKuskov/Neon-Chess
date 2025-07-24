import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { board } from '../modules/scene';

export class Cell {
	constructor(x, y, cube) {
		this.x = x;
		this.y = y;
		// use board.getCellByCoordinates() instead
		this.cube = cube;
		this.figure = null;
		this.isHighlighted = false;
	}

	static createCube(scene, color) {
		const cube = new THREE.Group();
		cube.userData.defaultColor = color;
		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const sideMaterial = new THREE.MeshPhongMaterial({
			color: 0x000000,
			transparent: true,
			opacity: 0.1,
		});
		const upperSurfaceMaterial = new THREE.MeshPhongMaterial({
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
			sideMaterial,
			sideMaterial,
			sideMaterial,
			sideMaterial,
			upperSurfaceMaterial,
			sideMaterial,
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

	highlight() {
		this.cube.children[0].material[4].color.set(0x22AA00);
		this.isHighlighted = true;
	}

	clearHighlight() {
		this.cube.children[0].material[4].color.set(this.cube.userData.defaultColor);
		this.isHighlighted = false;
	}

	addToBoard(board) {
		this.cube.position.set(this.x, this.y, 0);
		board.add(this.cube);
	}

	isEmpty() {
		return this.figure === null;
	}

	isEnemy(target) {
		if (!target.figure) return false;
		return this.figure.color !== target.figure.color;
	}

	isEmptyVertical(target) {
		if (this.x !== target.x) return false;

		const min = Math.min(this.y, target.y);
		const max = Math.max(this.y, target.y);

		for (let y = min + 1; y < max; y++) {
			if (board.getCellByCoordinates(this.x, y).figure !== null) {
				return false;
			}
		}
		return true;
	}

	isEmptyHorizontal(target) {
		if (this.y !== target.y) return false;

		const min = Math.min(this.x, target.x);
		const max = Math.max(this.x, target.x);

		for (let x = min + 1; x < max; x++) {
			if (board.getCellByCoordinates(x, this.y).figure !== null) {
				return false;
			}
		}
		return true;
	}

	isEmptyDiagonal(target) {
		// ensure the target cell is on the same diagonal
		const absX = Math.abs(target.x - this.x);
		const absY = Math.abs(target.y - this.y);
		if (absY !== absX) return false;

		// determine the direction of the diagonal
		const dy = this.y < target.y ? 1 : -1;
		const dx = this.x < target.x ? 1 : -1;

		// check if all cells between the source and target are empty
		for (let i = 1; i < absY; i++) {
			if (board.getCellByCoordinates(this.x + dx * i, this.y + dy * i).figure !== null) {
				return false;
			}
		}
		return true;
	}
}