import { Figure } from "./Figure";

export class King extends Figure {
	constructor(color, x, y) {
		super(color, x, y);
		this.name = "king";
	}

	canMove(target) {
		if (!super.canMove(target))
			return false;

		const dx = Math.abs(this.model.position.x - target.x);
		const dy = Math.abs(this.model.position.y - target.y);

		const validMove = (dx === 1 && dy === 1)
			|| (dx === 1 && dy === 1)
			|| (dx === 1 && dy === 0)
			|| (dx === 0 && dy === 1);

		if (!validMove) return false;

		// check if move will put king in check
		if (this.simulateMove(target, this.color)) {
			return false;
		}

		return true;
	}
}