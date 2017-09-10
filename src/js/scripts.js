document.addEventListener('DOMContentLoaded', main);

const items = [
  { icon: '🍓', hue: 114 },
  { icon: '🍏', hue: 354 },
  { icon: '🍕', hue: 241 },
  { icon: '🍌', hue: 286 },
  { icon: '🍔', hue: 174 },
  { icon: '🍆', hue:  54 }
];

function hueToColor(hue) {
  if (hue > 360) {
    hue = hue - 360;
  }
  return `hsl(${hue}, 70%, 60%)`;
}

const state = {
	tiles: [],
	tileAmount: 2, // amount of tiles on grid on one axis
	tileSize: null,

	canvasContext: null,

  initialTryCount: 5,
	tryCount: 5,

	windowWidth: window.outerWidth,

  endResult: ''
};

function main() {
	const buttonEls = document.querySelectorAll('.button');
	const overlayEl = document.querySelector('.overlay');
	const overlayHeadingEl = document.querySelector('.overlay-heading');
	const overlayMessageEl = document.querySelector('.overlay-message');
	const overlayButtonEl = document.querySelector('.overlay-button');
  const messageEl = document.querySelector('.message');

	buttonEls.forEach(tile => {
		tile.addEventListener('click', e => {
			const id = parseInt(e.target.value, 10);
			buttonHandler(id);
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

    state.canvasContext.fillStyle = '#f5f5f5';
		state.canvasContext.fillRect(0, 0, windowWidth, windowWidth);

		state.tileSize = Math.round(windowWidth / tileAmount);

    applyButtonColours();

		generateTiles();

    messageEl.innerHTML = '<p><strong>food flood</strong></p>';

		const intialColour = state.tiles[0][0].id;

		// affect the tiles and decide which tiles are active
		setAdjacentTilesWithCorrectColourActive(0, 0, intialColour);
		drawGrid();
	}

  function checkLose() {
    return state.tryCount <= 0;
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

  function decreaseTries(amount) {
    state.tryCount = state.tryCount - amount;
  }

	function buttonHandler(id) {
    for (let x = 0; x < state.tiles.length; x++) {
      for (let y = 0; y < state.tiles[x].length; y++ ) {
        const tile = state.tiles[x][y];
        if (tile.active) {
          setAdjacentTilesWithCorrectColourActive(x, y, id);
        }
      }
    }

		drawGrid();

		decreaseTries(1);
    messageEl.innerHTML = `<p><strong>${state.tryCount} tries</strong> left</p>`;

		if (checkWin()) {
			overlayEl.style.display = 'flex';
      overlayEl.classList.remove('overlay--dark');
			overlayHeadingEl.innerHTML = '🎉 You win!';
			overlayMessageEl.innerHTML = `You did it with <strong>${state.tryCount} tries </strong> left`;
      state.endResult = 'win';
		}
    else if(checkLose()) {
			overlayEl.style.display = 'flex';
      overlayEl.classList.add('overlay--dark');
			overlayHeadingEl.innerHTML = '😞 You lost...';
			overlayMessageEl.innerHTML = '<strong>Try again!</strong>';
      state.endResult = 'lose';
    }
	}

	// progression or refresh of a game
	function overlayButtonHandler() {
    if (state.endResult === 'win') {
	    state.tileAmount += 1;
      state.initialTryCount = Math.ceil(2.5 * (state.tileAmount - 1));
    }

    state.tryCount = state.initialTryCount;

    messageEl.innerHTML = '<p>Fill the screen with one colour</p>';
		overlayEl.style.display = 'none';
    overlayEl.classList.remove('overlay--dark');

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
	function setAdjacentTilesWithCorrectColourActive(x, y, id) {
		state.tiles[x][y].id = id; // the original squares colour

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

      const neighbourItem = state.tiles[neighbourX][neighbourY];

      if (!neighbourItem.active && neighbourItem.id === id) {
        neighbourItem.active = true;
        setAdjacentTilesWithCorrectColourActive(neighbourX, neighbourY, id);
      }
    }
	}

	// draw the tiles to the canvas
	function drawGrid() {
		const { tiles, tileSize } = state;

		for (let x = 0; x < tiles.length; x++) {
			for (let y = 0; y < tiles[x].length; y++) {
				const tile = tiles[x][y];

        const item = items[tile.id];
				drawTile(tileSize, x * tileSize, y * tileSize, item, tile.active);
			}
		}
	}

	function drawTile(size, originX, originY, item, active) {
		const { canvasContext } = state;

    canvasContext.fillStyle = hueToColor(item.hue);
		canvasContext.fillRect(
			Math.floor(originX),
			Math.floor(originY),
			Math.floor(size),
			Math.floor(size)
		);

    if (active) {
      canvasContext.fillStyle = 'rgba(245, 245, 245, 0.65)';
      const margin = size * 0.075;
      canvasContext.beginPath();
      canvasContext.arc(
        originX + (size / 2),
        originY + (size / 2),
        (size / 2) - margin,
        0,
        360
      );
      canvasContext.closePath();
      canvasContext.fill();
    }

    canvasContext.fillStyle = '#272727';
    const fontSize = size / 2;
    canvasContext.font = `${fontSize}px serif`;
    canvasContext.fillText(item.icon, originX + (size / 6), originY + fontSize + (size / 6));
	}

	function generateTiles() {
		const { tiles, tileAmount } = state;

		for (let x = 0; x < tileAmount; x++) {
			tiles[x] = [];

			for (let y = 0; y < tileAmount; y++) {
				const id = Math.floor(Math.random() * items.length);
				const active = (x === 0 && y === 0);

				tiles[x][y] = { id, active };
			}
		}

		// start with a standard pattern
		tiles[0][0].id = 0;
		tiles[1][0].id = 1;
		tiles[0][1].id = 2;
		tiles[1][1].id = 3;
	}

	function applyButtonColours() {
		buttonEls.forEach((element, i) => {
      const item = items[i];
			element.style.backgroundColor = hueToColor(item.hue);
      element.innerHTML = item.icon;
		});
	}
}
