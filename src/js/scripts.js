document.addEventListener('DOMContentLoaded', main);

const amountOfColoursToGenerate = 6; // amount of colours to generate from the seed

const state = {
	colours: [],

	tiles: [],
	tileAmount: 2, // amount of tiles on grid on one axis
	tileSize: null,
	
	canvasContext: null,

	tryCount: 0,

	windowWidth: window.outerWidth,
};

function main() {
	const buttonEls = document.querySelectorAll('.button');
	const overlayEl = document.querySelector('.overlay');
	const overlayMessageEl = document.querySelector('.overlay-message');
	const overlayButtonEl = document.querySelector('.overlay-button');

	buttonEls.forEach(tile => {
		tile.addEventListener('click', e => {
			const colourId = parseInt(e.target.value, 10);
			buttonHandler(colourId);
		})
	});

	overlayButtonEl.addEventListener('click', overlayButtonHandler);

	game();

	function game() {
		const { tiles, tileAmount, windowWidth } = state;

		const canvas = document.getElementById('canvas');

		// if the browser supports canvas
		if (!canvas.getContext) {
			alert('Your browser doesn\'t support canvas. :(');
		}

		state.canvasContext = canvas.getContext('2d');
		canvas.width = windowWidth;
		canvas.height = windowWidth;

		state.tileSize = Math.round(windowWidth / tileAmount);

		// generate the colours and tiles
		genColours();
		genItems();

		const intialColour = tiles[0][0].colourId;
		
		// affect the tiles and decide which tiles are active
		affectItems(intialColour);
		drawGrid();	
	}

	function checkWin() {
		const { tiles } = state;
		let allActive = true;

		for (let x = 0; x < tiles.length; x++) {
			for (let y = 0; y < tiles[x].length; y++) {
				const tile = tiles[x][y];

				if (!tile.active) {
					allActive = false;
					break;
				}
			}
		}

		return allActive;
	}

	function buttonHandler(colourId) {
		affectItems(colourId);
		drawGrid();

		state.tryCount++;

		if (checkWin()) {
			overlayEl.style.display = 'flex';
			overlayMessageEl.innerHTML = `You did it in ${state.tryCount} tries.`;
		}
	}

	// progression or refresh of a game
	function overlayButtonHandler() {
		state.tileAmount += 1;
		state.tryCount = 0;

		overlayEl.style.display = 'none';

		game(false);
	}

	function isXYInBounds(x, y) {
		const { tileAmount } = state;

		if (x < 0) return false;
		if (y < 0) return false;
		if (x >= tileAmount) return false;
		if (y >= tileAmount) return false;

		return true;
	}

	// decides which squares are active
	function affectItems(colourId) {
		const { tiles, tileAmount } = state;

		for (let x = 0; x < tileAmount; x++) {
			for (let y = 0; y < tileAmount; y++) {
				const tile = tiles[x][y];

				if (!tile.active) {
					continue;
				}

				tiles[x][y].colourId = colourId; // the original squares colour

				const neighbourItemPositions = [
					{ x:  0, y: -1}, // top
					{ x:  1, y:  0}, // right
					{ x:  0, y:  1}, // bottom
					{ x: -1, y:  0}, // left
				];

				for (let j = 0; j < neighbourItemPositions.length; j++) {
					const neighbourItemPosition = neighbourItemPositions[j];
					const neighbourX = x + neighbourItemPosition.x;
					const neighbourY = y + neighbourItemPosition.y;

					if (!isXYInBounds(neighbourX, neighbourY)) {
						continue;
					}
					
					const neighbourItem = tiles[neighbourX][ neighbourY];

					if (!neighbourItem.active && neighbourItem.colourId === colourId) {
						neighbourItem.active = true;
					}
				}
			}
		}
	}

	// draw the tiles to the canvas
	function drawGrid() {
		const { tiles, tileSize } = state;

		for (let x = 0; x < tiles.length; x++) {
			for (let y = 0; y < tiles[x].length; y++) {
				const tile = tiles[x][y];

				const colour = state.colours[tile.colourId];
				drawSquare(tileSize, x * tileSize, y * tileSize, colour);

				// if the square is active then add a pattern to indicate so
				if (tile.active) {
					drawPattern(tileSize, x * tileSize, y * tileSize);
				}
			}		
		}
	}

	function drawPattern(size, originX, originY) {
		const { canvasContext } = state;

		canvasContext.fillStyle = 'rgba(255, 255, 255, 0.5)'
		canvasContext.fillRect(
			Math.floor(originX + size / 4),
			Math.floor(originY + size / 4),
			Math.floor(size / 2),
			Math.floor(size / 2)
		);
	}

	function drawSquare(size, originX, originY, colour) {
		const { canvasContext } = state;

		canvasContext.fillStyle = colour;
		canvasContext.fillRect(
			Math.floor(originX),
			Math.floor(originY),
			Math.floor(size),
			Math.floor(size)
		);
	}

	function genItems() {
		const { colours, tiles, tileAmount } = state;

		for (let x = 0; x < tileAmount; x++) {
			tiles[x] = [];

			for (let y = 0; y < tileAmount; y++) {
				const colourId = Math.floor(Math.random() * colours.length);
				const active = (x === 0 && y === 0);

				tiles[x][y] = { colourId, active };
			}
		}

		// start with a standard pattern
		tiles[0][0].colourId = 0;
		tiles[1][0].colourId = 1;
		tiles[0][1].colourId = 2;
		tiles[1][1].colourId = 3;
	}

	function genColours() {
		// reset
		state.colours = [];

		const { colours } = state;

		const colourSeed = Math.floor(Math.random() * 360); // random colour seed

		for (let i = 0; i < amountOfColoursToGenerate; i++) {
			let hue = (colourSeed + (i * (360 / amountOfColoursToGenerate)));
			const saturation = 60;
			const lightness = 60;

			if (hue >= 360) { hue -= 360; }
			
			const colour = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
			colours.push(colour)
		}

		applyButtonColours();
	}

	function applyButtonColours() {
		const { colours } = state;

		buttonEls.forEach((element, i) => {
			element.style.backgroundColor = colours[i];
		});
	}
}