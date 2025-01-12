import * as THREE from 'three';
import { Cell } from './Cell';
import { Pawn } from './Figures/Pawn';
import { Rook } from './Figures/Rook';
import { Knight } from './Figures/Knight';
import { Bishop } from './Figures/Bishop';
import { King } from './Figures/King';
import { Queen } from './Figures/Queen';

export class Board {
	constructor(scene) {
		// if not widely used, move to method
		this.scene = scene;
		this.board = new THREE.Group();
		this.cells = [];
		this.size = 8;
		// this.figures = [];
		this.highlightEnabled = true;
	}

	init() {
		const blueCell = Cell.createCube(this.scene, 0x222299);
		const redCell = Cell.createCube(this.scene, 0x992222);

		for (let i = this.size; i > 0; i--) {
			const row = [];
			for (let j = 0; j < this.size; j++) {
				const cube = (i + j) % 2 === 0 ? blueCell.clone() : redCell.clone();
				const cell = new Cell(this.scene, j - 3.5, i - 4.5, cube);
				cube.children[0].material[4] = cube.children[0].material[4].clone();
				cube.userData.maintainingObject = cell;
				cell.addToBoard(this.board);
				row.push(cell);
			}
			this.cells.push(row);
		}


		this.board.rotation.x = -1.1;
		this.scene.add(this.board);
		this.scene.userData.playBoard = this;
	}

	highlightAvailableMoves(figureHolder) {
		if (!this.highlightEnabled) return;
		for (let row of this.cells) {
			for (let cell of row) {
				if (figureHolder.canMove(cell)) {
					cell.cube.children[0].material[4].color.set(0x22AA00);
				}
			}
		}
	}

	clearHighlights() {
		if (!this.highlightEnabled) return;
		for (let row of this.cells) {
			for (let cell of row) {
				cell.cube.children[0].material[4].color.set(cell.cube.userData.defaultColor);
			}
		}
	}

	addFigures(figureModels, redModelColor, blueModelColor) {
		this.addPawns(figureModels, redModelColor, blueModelColor);
		this.addRooks(figureModels, redModelColor, blueModelColor);
		this.addKnights(figureModels, redModelColor, blueModelColor);
		this.addBishops(figureModels, redModelColor, blueModelColor);
		this.addKings(figureModels, redModelColor, blueModelColor);
		this.addQueens(figureModels, redModelColor, blueModelColor);
	}

	addPawns(figureModels, redModelColor, blueModelColor) {
		for (let i = 0; i < 8; i++) {
			const bluePawn = new Pawn(blueModelColor, this.cells[1][i]);
			const redPawn = new Pawn(redModelColor, this.cells[6][i]);
			bluePawn.place(this.scene, figureModels.playerOne, i - 3.5, 2.5, Math.PI * 2, blueModelColor);
			redPawn.place(this.scene, figureModels.playerTwo, i - 3.5, -2.5, Math.PI, redModelColor);
		}
	}

	addRooks(figureModels, redModelColor, blueModelColor) {
		const blueRook1 = new Rook(blueModelColor, this.cells[0][0]);
		const blueRook2 = new Rook(blueModelColor, this.cells[0][7]);
		const redRook1 = new Rook(redModelColor, this.cells[7][0]);
		const redRook2 = new Rook(redModelColor, this.cells[7][7]);

		blueRook1.place(this.scene, figureModels.playerOne, -3.5, 3.5, Math.PI * 2, blueModelColor);
		blueRook2.place(this.scene, figureModels.playerOne, 3.5, 3.5, Math.PI * 2, blueModelColor);
		redRook1.place(this.scene, figureModels.playerTwo, -3.5, -3.5, Math.PI, redModelColor);
		redRook2.place(this.scene, figureModels.playerTwo, 3.5, -3.5, Math.PI, redModelColor);
	}

	addKnights(figureModels, redModelColor, blueModelColor) {
		const blueKnight1 = new Knight(blueModelColor, this.cells[0][1]);
		const blueKnight2 = new Knight(blueModelColor, this.cells[0][6]);
		const redKnight1 = new Knight(redModelColor, this.cells[7][1]);
		const redKnight2 = new Knight(redModelColor, this.cells[7][6]);

		blueKnight1.place(this.scene, figureModels.playerOne, -2.5, 3.5, Math.PI * 2, blueModelColor);
		blueKnight2.place(this.scene, figureModels.playerOne, 2.5, 3.5, Math.PI * 2, blueModelColor);
		redKnight1.place(this.scene, figureModels.playerTwo, -2.5, -3.5, Math.PI, redModelColor);
		redKnight2.place(this.scene, figureModels.playerTwo, 2.5, -3.5, Math.PI, redModelColor);
	}

	addBishops(figureModels, redModelColor, blueModelColor) {
		const blueBishop1 = new Bishop(blueModelColor, this.cells[0][2]);
		const blueBishop2 = new Bishop(blueModelColor, this.cells[0][5]);
		const redBishop1 = new Bishop(redModelColor, this.cells[7][2]);
		const redBishop2 = new Bishop(redModelColor, this.cells[7][5]);

		blueBishop1.place(this.scene, figureModels.playerOne, -1.5, 3.5, Math.PI * 2, blueModelColor);
		blueBishop2.place(this.scene, figureModels.playerOne, 1.5, 3.5, Math.PI * 2, blueModelColor);
		redBishop1.place(this.scene, figureModels.playerTwo, -1.5, -3.5, Math.PI, redModelColor);
		redBishop2.place(this.scene, figureModels.playerTwo, 1.5, -3.5, Math.PI, redModelColor);
	}

	addQueens(figureModels, redModelColor, blueModelColor) {
		const blueQueen = new Queen(blueModelColor, this.cells[0][4]);
		const redQueen = new Queen(redModelColor, this.cells[7][4]);

		blueQueen.place(this.scene, figureModels.playerOne, 0.5, 3.5, Math.PI * 2, blueModelColor);
		redQueen.place(this.scene, figureModels.playerTwo, 0.5, -3.5, Math.PI, redModelColor);
	}

	addKings(figureModels, redModelColor, blueModelColor) {
		const blueKing = new King(blueModelColor, this.cells[0][3]);
		const redKing = new King(redModelColor, this.cells[7][3]);

		blueKing.place(this.scene, figureModels.playerOne, -0.5, 3.5, Math.PI * 2, blueModelColor);
		redKing.place(this.scene, figureModels.playerTwo, -0.5, -3.5, Math.PI, redModelColor);
	}
}