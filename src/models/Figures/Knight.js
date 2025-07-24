import { Figure } from "./Figure";

export class Knight extends Figure {
	constructor(color, x, y) {
		super(color, x, y);
		this.name = "knight";
	}

	canMove(target, color = null) {
		if (!super.canMove(target))
			return false;

		const dx = Math.abs(this.model.position.x - target.x);
		const dy = Math.abs(this.model.position.y - target.y);

		const validMove = (dx === 1 && dy === 2) || (dx === 2 && dy === 1);

		if (!validMove) return false;

		if (color && this.simulateMove(target, color)) {
			return false;
		}

		return true;
	}
}