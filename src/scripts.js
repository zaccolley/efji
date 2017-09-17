function redirectToHttps() {
  if (window.location.protocol != 'https:') {
    window.location.replace(location.href.replace('http://', 'https://'));
  }
}
redirectToHttps();

document.addEventListener('DOMContentLoaded', main);

const items = [
  { name: 'apple', color: 'hsl(86, 62%, 45%)' },
  { name: 'strawberry', color: 'hsl(5, 63%, 54%)' },
  { name: 'droplet', color: 'hsl(200, 86%, 49%)' },
  { name: 'banana', color: 'hsl(44, 91%, 46%)' },
  { name: 'chestnut', color: 'hsl(18, 91%, 21%)' },
  { name: 'eggplant', color: 'hsl(304, 29%, 46%)' },
];

function loadImages() {
  const imagesToLoad = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    const imageToLoad = new Promise(resolve => {
      const image = new Image();
      image.src = `images/${item.name}.png`;
      image.addEventListener('load',  resolve);

      item.image = image;
    });

    imagesToLoad.push(imageToLoad);
  }

  return Promise.all(imagesToLoad);
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

  const instructionsOverlayEl = document.querySelector('.overlay--instructions');
  const instructionsOverlayButtonEl = instructionsOverlayEl.querySelector('.overlay-button');

  instructionsOverlayButtonEl.addEventListener('click', handleInstructionsOverlayButtonElClick);
  function handleInstructionsOverlayButtonElClick() {
    instructionsOverlayEl.style.display = 'none';
  }

  const overlayEl = document.querySelector('.overlay--result');
	const overlayHeadingEl = overlayEl.querySelector('.overlay-heading');
	const overlayMessageEl = overlayEl.querySelector('.overlay-message');
	const overlayButtonEl = overlayEl.querySelector('.overlay-button');

  const messageEl = document.querySelector('.message');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }

	buttonEls.forEach(tile => {
		tile.addEventListener('click', e => {
			const id = parseInt(e.target.value, 10);
			buttonHandler(id);
		})
	});

	overlayButtonEl.addEventListener('click', overlayButtonHandler);

  loadImages().then(() => {
	   game();
  });

	function game() {
		const { tiles, tileAmount, windowWidth } = state;

		const canvas = document.getElementById('canvas');

		// if the browser supports canvas
		if (!canvas.getContext) {
			alert('Your browser doesn\'t support canvas. :(');
		}

		state.canvasContext = canvas.getContext('2d', { alpha: false });
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
			overlayHeadingEl.innerHTML = 'You win!';
			overlayMessageEl.innerHTML = `You did it with <strong>${state.tryCount} tries </strong> left`;
      state.endResult = 'win';
		}
    else if(checkLose()) {
			overlayEl.style.display = 'flex';
      overlayEl.classList.add('overlay--dark');
			overlayHeadingEl.innerHTML = 'You lost...';
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

    canvasContext.fillStyle = item.color;
		canvasContext.fillRect(
			Math.floor(originX),
			Math.floor(originY),
			Math.floor(size),
			Math.floor(size)
		);

    if (active) {
      const activeMargin = size * 0.10;
      canvasContext.fillStyle = 'rgba(245, 245, 245, 0.65)';
      canvasContext.fillRect(
  			Math.floor(originX + activeMargin),
  			Math.floor(originY + activeMargin),
  			Math.floor(size - (activeMargin * 2)),
  			Math.floor(size - (activeMargin * 2))
  		);
    }

    const imageMargin = size * 0.15;
    const image = items.find(i => i.name === item.name).image;
    canvasContext.drawImage(
      image,
      Math.floor(originX + imageMargin),
      Math.floor(originY + imageMargin),
      Math.floor(size - (imageMargin * 2)),
      Math.floor(size - (imageMargin * 2))
    );
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
      element.innerHTML = item.name;
			element.style.backgroundColor = item.color;
      element.style.backgroundImage = `url('${item.image.src}')`;
		});
	}
}
