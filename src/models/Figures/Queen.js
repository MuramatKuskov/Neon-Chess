import { board } from "../../modules/scene";
import { Figure } from "./Figure";

export class Queen extends Figure {
	constructor(color, x, y) {
		super(color, x, y);
		this.name = "queen";
	}

	canMove(target, color = null) {
		if (!super.canMove(target))
			return false;

		const currentCell = board.getCellByCoordinates(this.model.position.x, this.model.position.y);
		if (currentCell.isEmptyVertical(target)) {
			if (color && this.simulateMove(target, color)) {
				return false;
			}
			return true;
		}
		if (currentCell.isEmptyHorizontal(target)) {
			if (color && this.simulateMove(target, color)) {
				return false;
			}
			return true;
		}
		if (currentCell.isEmptyDiagonal(target)) {
			if (color && this.simulateMove(target, color)) {
				return false;
			}
			return true;
		}

		return false;
	}
}