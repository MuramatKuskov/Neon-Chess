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
		this.figures = [];
		this.isInitialState = true;
	}

	init() {
		const blueCell = Cell.createCube(this.scene, 0x2222a9);
		const redCell = Cell.createCube(this.scene, 0xa92222);

		for (let i = this.size; i > 0; i--) {
			const row = [];
			for (let j = 0; j < this.size; j++) {
				const cube = (i + j) % 2 === 0 ? redCell.clone() : blueCell.clone();
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
		return this;
	}

	reset() {
		for (let i = 0; i < this.figures.length; i++) {
			const figure = this.figures[i];
			if (figure.isInitialPosition) continue;

			if (figure.defeated) figure.defeated = false;

			if (figure.model === 'pawn') {
				let row = figure.color === 0xc00f00 ? 6 : 1;
				for (let cell of this.cells[row]) {
					if (!cell.figure || cell.figure.color !== figure.color || cell.figure.model !== 'pawn') {
						figure.move(cell);
						figure.isInitialPosition = true;
						figure.isFirstMove = true;
					}
				}
			} else if (figure.model === 'rook') {
				let row = figure.color === 0xc00f00 ? 7 : 0;
				let col = this.cells[row][0].figure === null ? 0 : 7;
				figure.move(this.cells[row][col]);
				figure.isInitialPosition = true;
			} else if (figure.model === 'knight') {
				let row = figure.color === 0xc00f00 ? 7 : 0;
				let col = this.cells[row][1].figure === null ? 1 : 6;
				figure.move(this.cells[row][col]);
				figure.isInitialPosition = true;
			} else if (figure.model === 'bishop') {
				let row = figure.color === 0xc00f00 ? 7 : 0;
				let col = this.cells[row][2].figure === null ? 2 : 5;
				figure.move(this.cells[row][col]);
				figure.isInitialPosition = true;
			} else if (figure.model === 'queen') {
				let row = figure.color === 0xc00f00 ? 7 : 0;
				figure.move(this.cells[row][3]);
				figure.isInitialPosition = true;
			} else if (figure.model === 'king') {
				let row = figure.color === 0xc00f00 ? 7 : 0;
				figure.move(this.cells[row][4]);
				figure.isInitialPosition = true;
			}
		}

		this.isInitialState = true;
	}

	setState(state = null) {
		// set state from data

	}

	isCheck(color) {
		// find king's cell
		const kingPosition = this.cells.flat().find(cell => cell.figure?.model === 'king' && cell.figure.color === color);

		for (let figure of this.figures) {
			if (!figure.defeated && figure.color !== color) {
				if (figure.canMove(kingPosition)) {
					return true;
				}
			}
		}

		return false;
	}

	isCheckmate(color) {
		// iterate over figures
		for (let figure of this.figures) {
			// if figure belongs to player
			if (figure.color === color && !figure.defeated) {
				// iterate over cells to simulate move
				for (let row of this.cells) {
					for (let simTargetCell of row) {
						// canMove with additional params returns whether
						// move will defend from check or not
						if (figure.canMove(simTargetCell, color)) {
							return false;
						}
					}
				}
			}
		}

		return true;
	}

	highlightAvailableMoves(figure, isCheck = false) {
		for (let row of this.cells) {
			for (let cell of row) {
				if (figure.canMove(cell, isCheck ? figure.color : null)) {
					cell.highlight();
				}
			}
		}
	}

	clearHighlights() {
		for (let row of this.cells) {
			for (let cell of row) {
				cell.clearHighlight();
			}
		}
	}

	placeFigure(maintainingObject, userCache, model, cell, rotation, color) {
		const cachedModel = userCache.get(model).clone();

		cachedModel.children[0].material.color.set(color);

		cachedModel.position.set(cell.x, cell.y, 0.9);
		cachedModel.rotation.y = rotation;

		cachedModel.userData = {
			maintainingObject: maintainingObject,
		};
		maintainingObject.figure = cachedModel;
		maintainingObject.cell.figure = maintainingObject;
		this.scene.userData.playBoard.board.add(cachedModel);
		this.figures.push(maintainingObject);
	}

	addFigures(figureModels) {
		const redModelColor = 0xc00f00;
		const blueModelColor = 0x0725E1;

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
			this.placeFigure(bluePawn, figureModels.playerOne, 'pawn', this.cells[1][i], Math.PI * 2, blueModelColor);
			this.placeFigure(redPawn, figureModels.playerTwo, 'pawn', this.cells[6][i], Math.PI, redModelColor);
		}
	}

	addRooks(figureModels, redModelColor, blueModelColor) {
		const blueRook1 = new Rook(blueModelColor, this.cells[0][0]);
		const blueRook2 = new Rook(blueModelColor, this.cells[0][7]);
		const redRook1 = new Rook(redModelColor, this.cells[7][0]);
		const redRook2 = new Rook(redModelColor, this.cells[7][7]);

		this.placeFigure(blueRook1, figureModels.playerOne, 'rook', this.cells[0][0], Math.PI * 2, blueModelColor);
		this.placeFigure(blueRook2, figureModels.playerOne, 'rook', this.cells[0][7], Math.PI * 2, blueModelColor);
		this.placeFigure(redRook1, figureModels.playerTwo, 'rook', this.cells[7][0], Math.PI, redModelColor);
		this.placeFigure(redRook2, figureModels.playerTwo, 'rook', this.cells[7][7], Math.PI, redModelColor);
	}

	addKnights(figureModels, redModelColor, blueModelColor) {
		const blueKnight1 = new Knight(blueModelColor, this.cells[0][1]);
		const blueKnight2 = new Knight(blueModelColor, this.cells[0][6]);
		const redKnight1 = new Knight(redModelColor, this.cells[7][1]);
		const redKnight2 = new Knight(redModelColor, this.cells[7][6]);

		this.placeFigure(blueKnight1, figureModels.playerOne, 'knight', this.cells[0][1], Math.PI * 2, blueModelColor);
		this.placeFigure(blueKnight2, figureModels.playerOne, 'knight', this.cells[0][6], Math.PI * 2, blueModelColor);
		this.placeFigure(redKnight1, figureModels.playerTwo, 'knight', this.cells[7][1], Math.PI, redModelColor);
		this.placeFigure(redKnight2, figureModels.playerTwo, 'knight', this.cells[7][6], Math.PI, redModelColor);
	}

	addBishops(figureModels, redModelColor, blueModelColor) {
		const blueBishop1 = new Bishop(blueModelColor, this.cells[0][2]);
		const blueBishop2 = new Bishop(blueModelColor, this.cells[0][5]);
		const redBishop1 = new Bishop(redModelColor, this.cells[7][2]);
		const redBishop2 = new Bishop(redModelColor, this.cells[7][5]);

		this.placeFigure(blueBishop1, figureModels.playerOne, 'bishop', this.cells[0][2], Math.PI * 2, blueModelColor);
		this.placeFigure(blueBishop2, figureModels.playerOne, 'bishop', this.cells[0][5], Math.PI * 2, blueModelColor);
		this.placeFigure(redBishop1, figureModels.playerTwo, 'bishop', this.cells[7][2], Math.PI, redModelColor);
		this.placeFigure(redBishop2, figureModels.playerTwo, 'bishop', this.cells[7][5], Math.PI, redModelColor);
	}

	addQueens(figureModels, redModelColor, blueModelColor) {
		const blueQueen = new Queen(blueModelColor, this.cells[0][3]);
		const redQueen = new Queen(redModelColor, this.cells[7][3]);

		this.placeFigure(blueQueen, figureModels.playerOne, 'queen', this.cells[0][3], Math.PI * 2, blueModelColor);
		this.placeFigure(redQueen, figureModels.playerTwo, 'queen', this.cells[7][3], Math.PI, redModelColor);
	}

	addKings(figureModels, redModelColor, blueModelColor) {
		const blueKing = new King(blueModelColor, this.cells[0][4]);
		const redKing = new King(redModelColor, this.cells[7][4]);

		this.placeFigure(blueKing, figureModels.playerOne, 'king', this.cells[0][4], Math.PI * 2, blueModelColor);
		this.placeFigure(redKing, figureModels.playerTwo, 'king', this.cells[7][4], Math.PI, redModelColor);
	}
}