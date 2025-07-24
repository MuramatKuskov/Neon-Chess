const inverseCountdown = 5;

export class Timer {
	constructor(playerOne, playerTwo) {
		this.node = document.getElementById('timer');
		this.node.style.visibility = 'visible';
		this.node.innerHTML = `${playerOne.timeReserve} : ${playerTwo.timeReserve}`;
		this.playerOne = playerOne;
		this.playerTwo = playerTwo;
		this.currentPlayer = playerOne;
		this.node.className = this.currentPlayer.color === playerOne.color ? 'red' : 'blue';
		this.interval = null;
		this.inverseCountdown = inverseCountdown;
	}

	set(endGame) {
		this.currentPlayer = this.playerOne;
		this.node.className = this.currentPlayer.color === this.playerOne.color ? 'red' : 'blue';

		if (this.interval) clearInterval(this.interval);
		this.interval = setInterval(() => this.timerCallback(endGame), 1000);
	}

	stop() {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}
	}

	switchPlayers(currentPlayer) {
		this.currentPlayer = currentPlayer.color === this.playerOne.color ? this.playerOne : this.playerTwo;
		this.node.className = this.currentPlayer.color === this.playerOne.color ? 'red' : 'blue';
	}

	timerCallback(endGame) {
		if (this.inverseCountdown > 0) {
			this.inverseCountdown -= 1;
			this.node.innerHTML = this.inverseCountdown;
			return;
		}

		this.currentPlayer.timeReserve -= 1;

		if (this.currentPlayer !== this.playerOne && this.currentPlayer !== this.playerTwo) {
			console.error('Current player is not one of the players');
		}

		this.node.innerHTML = `${this.playerOne.timeReserve} : ${this.playerTwo.timeReserve}`;

		if (this.currentPlayer.timeReserve === 0) {

			const winner = this.playerOne.timeReserve === 0 ? this.playerTwo : this.playerOne;

			endGame(winner);
		}
	}
}