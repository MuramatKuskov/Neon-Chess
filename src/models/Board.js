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
		// if not widely used, consider args
		this.scene = scene;
		this.board = new THREE.Group();
		this.cells = [];
		this.size = 8;
		this.figures = new Map();
		this.isInitialState = true;
		this.redModelColor = 0xc00f00;
		this.blueModelColor = 0x0725E1;
		this.redCellColor = 0xa92222;
		this.blueCellColor = 0x2222a9;
		this.hasHighlightedCells = false;
	}

	init() {
		const blueCell = Cell.createCube(this.scene, this.blueCellColor);
		const redCell = Cell.createCube(this.scene, this.redCellColor);

		for (let i = this.size; i > 0; i--) {
			const row = [];
			for (let j = 0; j < this.size; j++) {
				const cube = (i + j) % 2 === 0 ? redCell.clone() : blueCell.clone();
				const cell = new Cell(j - 3.5, i - 4.5, cube);

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
		this.figures.forEach(figure => {
			if (figure.isInitialPosition) return;

			if (figure.defeated) {
				figure.defeated = false;
			} else {
				const cellToLeave = this.getCellByCoordinates(figure.model.position.x, figure.model.position.y);
				cellToLeave.figure = null;
			}

			if (figure.name === 'pawn') figure.isFirstStep = true;

			figure.model.position.set(figure.initialPosition.x, figure.initialPosition.y, figure.initialPosition.z);
			figure.model.rotation.y = figure.initialPosition.rotation;
			this.getCellByCoordinates(figure.initialPosition.x, figure.initialPosition.y).figure = figure;
			figure.isInitialPosition = true;
		});

		this.isInitialState = true;
	}

	getCellByCoordinates(x, y) {
		const cellX = x + 3.5;
		const cellY = Math.abs(y - 3.5);

		return this.cells[cellY][cellX];
	}

	setState(serverFigures) {
		// figures: [[id, state], [id, state], ...]
		serverFigures.forEach(figureData => {
			if (figureData[1].isInitialPosition) return;
			this.isInitialState = false;
			const localFigure = this.figures.get(figureData[0]);

			localFigure.isInitialPosition = false;
			if (localFigure.hasOwnProperty('isFirstStep')) {
				localFigure.isFirstStep = false;
			}
			localFigure.defeated = figureData[1].defeated;
			localFigure.model.position.set(
				figureData[1].position.x,
				figureData[1].position.y,
				figureData[1].position.z
			);
			localFigure.model.rotation.y = figureData[1].rotation;

			this.getCellByCoordinates(localFigure.initialPosition.x, localFigure.initialPosition.y)
				.figure = null;
			const newCell = this.getCellByCoordinates(localFigure.model.position.x, localFigure.model.position.y);
			if (newCell) newCell.figure = localFigure
		});
	}

	isCheck(color) {
		// find king's cell
		const kingPosition = this.cells.flat().find(cell => cell.figure?.name === 'king' && cell.figure.color === color);

		let result = false;

		this.figures.forEach(figure => {
			if (!figure.defeated && figure.color !== color && figure.canMove(kingPosition)) {
				result = true;
			}
		});

		return result;
	}

	isCheckmate(color) {
		// iterate over figures
		this.figures.forEach(figure => {
			// if figure belongs to player in danger
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
		});

		return true;
	}

	highlightAvailableMoves(figure, isCheck = false) {
		for (let row of this.cells) {
			for (let cell of row) {
				if (figure.canMove(cell, isCheck ? figure.color : null)) {
					cell.highlight();
					this.hasHighlightedCells = true;
				}
			}
		}
	}

	clearHighlights() {
		for (let row of this.cells) {
			for (let cell of row) {
				if (cell.isHighlighted) cell.clearHighlight();
			}
		}
		this.hasHighlightedCells = false;
	}

	addFigures(figureModels) {
		this.addPawns(figureModels);
		this.addRooks(figureModels);
		this.addKnights(figureModels);
		this.addBishops(figureModels);
		this.addQueens(figureModels);
		this.addKings(figureModels);
	}

	addPawns(figureModels) {
		for (let i = 0; i < 8; i++) {
			new Pawn(this.blueModelColor, i - 3.5, 2.5).addToBoard(figureModels.blue);
			new Pawn(this.redModelColor, i - 3.5, -2.5).addToBoard(figureModels.red);
		}
	}

	addRooks(figureModels) {
		new Rook(this.blueModelColor, -3.5, 3.5).addToBoard(figureModels.blue);
		new Rook(this.blueModelColor, 3.5, 3.5).addToBoard(figureModels.blue);
		new Rook(this.redModelColor, -3.5, -3.5).addToBoard(figureModels.red);
		new Rook(this.redModelColor, 3.5, -3.5).addToBoard(figureModels.red);
	}

	addKnights(figureModels) {
		new Knight(this.blueModelColor, -2.5, 3.5).addToBoard(figureModels.blue);
		new Knight(this.blueModelColor, 2.5, 3.5).addToBoard(figureModels.blue);
		new Knight(this.redModelColor, -2.5, -3.5).addToBoard(figureModels.red);
		new Knight(this.redModelColor, 2.5, -3.5).addToBoard(figureModels.red);
	}

	addBishops(figureModels) {
		new Bishop(this.blueModelColor, -1.5, 3.5).addToBoard(figureModels.blue);
		new Bishop(this.blueModelColor, 1.5, 3.5).addToBoard(figureModels.blue);
		new Bishop(this.redModelColor, -1.5, -3.5).addToBoard(figureModels.red);
		new Bishop(this.redModelColor, 1.5, -3.5).addToBoard(figureModels.red);
	}

	addQueens(figureModels) {
		new Queen(this.blueModelColor, -0.5, 3.5).addToBoard(figureModels.blue);
		new Queen(this.redModelColor, -0.5, -3.5).addToBoard(figureModels.red);
	}

	addKings(figureModels) {
		new King(this.blueModelColor, 0.5, 3.5).addToBoard(figureModels.blue);
		new King(this.redModelColor, 0.5, -3.5).addToBoard(figureModels.red);
	}
}