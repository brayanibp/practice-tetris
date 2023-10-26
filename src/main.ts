import './style.css';

const canvas = document.querySelector('canvas') as HTMLCanvasElement;

const context = canvas.getContext('2d') as CanvasRenderingContext2D;

const BLOCK_SIZE = 15;
const BOARD_WIDTH = 20;
const BOARD_HEIGHT = 30;

let score = 0;

canvas.width = BLOCK_SIZE * BOARD_WIDTH;
canvas.height = BLOCK_SIZE * BOARD_HEIGHT;
context.scale(BLOCK_SIZE, BLOCK_SIZE);

const COLORS = [
  'yellow',
  'red',
  'blue',
  'green'
];

const EVENT_MOVEMENTS = {
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  DOWN: 'ArrowDown',
  ROTATE: 'ArrowUp'
};

// pieces

const PIECES = [
  [
    [1],
    [1],
    [1]
  ],
  [
    [1, 0],
    [1, 0],
    [1, 1]
  ],
  [
    [0, 1],
    [0, 1],
    [1, 1]
  ],
  [
    [1, 1],
    [1, 1]
  ],
  [
    [1, 0],
    [1, 1]
  ],
  [
    [0, 1],
    [1, 1]
  ],
  [
    [0, 1, 0],
    [1, 1, 1]
  ],
  [
    [1, 1, 0],
    [0, 1, 1]
  ]
];

let canPlayAudio = true;

const audio = new window.Audio('../assets/audio/Tetris.mp3');

const piece = {
  position: {
    x: 5,
    y: 5
  },
  shape: getRandomPiece(),
  color: getRandomColor()
};

function generateBoard (width: number, height: number): number[][] {
  return Array(height).fill(null).map((_) => Array<number>(width).fill(0));
}

// board
const board = generateBoard(BOARD_WIDTH, BOARD_HEIGHT);

// game loop

let dropCounter = 0;
let lastTime = 0;

let minimumTime = 600;

function incrementSpeed (): void {
  if (minimumTime === 100) return;
  if (score % 10 === 0) {
    minimumTime = minimumTime - 10;
  }
}

function update (time = 0): void {
  const deltaTime = time - lastTime;
  lastTime = time;

  dropCounter += deltaTime;
  if (dropCounter > minimumTime) {
    piece.position.y++;
    dropCounter = 0;
    if (checkCollision()) {
      piece.position.y--;
      freezePiece();
      removeCompletedRows();
    }
  }

  draw();
  window.requestAnimationFrame(update);
}

function draw (): void {
  context.fillStyle = '#000000';
  context.fillRect(0, 0, canvas.width, canvas.height);

  board.forEach((row, y) => {
    row.forEach((column: number, x: number) => {
      const shouldBeFilled: boolean = Boolean(column);
      if (shouldBeFilled) {
        context.fillStyle = 'white';
        context.fillRect(x, y, 1, 1);
      }
    });
  });

  piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      const shouldBeFilled: boolean = Boolean(value);
      if (shouldBeFilled) {
        context.fillStyle = piece.color;
        context.fillRect(x + piece.position.x, y + piece.position.y, 1, 1);
      }
    });
  });

  const $score = document.querySelector('span') as HTMLSpanElement;
  $score.innerText = score.toString();
}

function checkCollision (): boolean {
  return piece.shape.some((row, y) => {
    return row.some((column, x) => {
      const isCollisioning = column !== 0 && board[y + piece.position.y]?.[x + piece.position.x] !== 0;
      return isCollisioning;
    });
  });
}

function freezePiece (): void {
  piece.shape.forEach((row, y) => {
    row.forEach((column, x) => {
      if (column === 1) {
        board[y + piece.position.y] ??= [];
        board[y + piece.position.y][x + piece.position.x] = 1;
      }
    });
  });
  resetPosition();
  piece.shape = getRandomPiece();
}

function removeCompletedRows (): void {
  const completedRows: number[] = [];

  board.forEach((row, y) => {
    if (row.every((column) => column === 1)) {
      completedRows.push(y);
    }
  });

  completedRows.forEach(row => {
    board.splice(row, 1);
    const emptyRow = Array(BOARD_WIDTH).fill(0);
    board.unshift(emptyRow);
    score += 10;
  });

  incrementSpeed();
}

function getRandomPiece (): number[][] {
  return PIECES[Math.floor(Math.random() * (PIECES.length - 1))];
}

function getRandomColor (): string {
  return COLORS[Math.floor(Math.random() * (COLORS.length - 1))];
}

function resetPosition (): void {
  piece.position.x = Math.floor(BOARD_WIDTH / 2 - 2);
  piece.position.y = 0;
  piece.shape = getRandomPiece();
  piece.color = getRandomColor();
  if (checkCollision()) {
    alert('Game Over');
    board.forEach((row: number[]) => row.fill(0));
  }
}

async function playAudio (willPlay: boolean): Promise<boolean> {
  if (willPlay) {
    audio.volume = 0.1;
    audio.loop = true;
    await audio.play();
  } else {
    audio.pause();
  }
  return !willPlay;
}

document.addEventListener('keydown', (event) => {
  if (event.key === EVENT_MOVEMENTS.LEFT) {
    piece.position.x--;
    if (checkCollision()) {
      piece.position.x++;
    }
  };
  if (event.key === EVENT_MOVEMENTS.RIGHT) {
    piece.position.x++;
    if (checkCollision()) {
      piece.position.x--;
    }
  }
  if (event.key === EVENT_MOVEMENTS.DOWN) {
    piece.position.y++;
    if (checkCollision()) {
      piece.position.y--;
      freezePiece();
      removeCompletedRows();
    }
  };
  if (event.key === EVENT_MOVEMENTS.ROTATE) {
    const rotated = [];
    for (let index = 0; index < piece.shape[0].length; index++) {
      const row = [];
      for (let column = piece.shape.length - 1; column >= 0; column--) {
        piece.shape[column] ??= [];
        row.push(piece.shape[column][index]);
      }
      rotated.push(row);
    }
    const prevPiece = [...piece.shape];
    piece.shape = rotated;
    if (checkCollision()) {
      piece.shape = prevPiece;
    }
  }
});

const $startGameButton = document.querySelector('#start');
const $musicButton = document.querySelector('#music');

$startGameButton?.addEventListener('click', (_) => {
  $startGameButton.remove();
  update();
  playAudio(canPlayAudio)
    .then((result) => {
      canPlayAudio = result;
    })
    .catch((rejection) => {
      console.log(rejection);
    });
});

$musicButton?.addEventListener('click', (_) => {
  playAudio(canPlayAudio)
    .then((result) => {
      canPlayAudio = result;
    })
    .catch((rejection) => {
      console.log(rejection);
    });
});
