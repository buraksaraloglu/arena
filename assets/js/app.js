const BG_COLOR = '#212529';
const PLAYER_COLOR = 'green';
const FOOD_COLOR = '#e66916';

let canvas, ctx;

const socket = io('https://arena-bs.herokuapp.com');

const gameSection = document.getElementById('gameSection');
const gameScreen = document.getElementById('gameScreen');
const initialScreen = document.getElementById('initialScreen');
const newGameButton = document.getElementById('newGameButton');
const joinGameButton = document.getElementById('joinGameButton');
const usernameInput = document.getElementById('usernameInput');
const gameCodeInput = document.getElementById('gameCodeInput');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');

const statsBoard = document.getElementById('statsBoard');
const healthText = document.getElementById('health');
const powerText = document.getElementById('power');
const staminaText = document.getElementById('stamina');

const startVoteScreen = document.getElementById('startVote');
const userCount = document.getElementById('userCount');
const voteCount = document.getElementById('voteCount');
const voteButton = document.getElementById('voteButton');

const playerColors = [PLAYER_COLOR, 'red', 'yellow', 'blue'];

let roomName;
let playerNumber;
let playerCount;
let currentStatus = 'Waiting...';
let gameActive = false;

const handleKeyDown = (e) => {
  socket.emit('keydown', e.keyCode);
};

const init = (state) => {
  initialScreen.style.display = 'none';
  gameSection.style.display = 'flex';
  gameScreen.style.display = 'inherit';

  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  canvas.width = canvas.height = 640;

  const gridSize = state.gridSize;
  const size = canvas.width / gridSize;

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = '2rem Arial';
  ctx.fillStyle = 'white';
  ctx.fillText(currentStatus, 40, canvas.height / 2);

  state.players.map((player, index) => {
    paintPlayer(player, size, playerColors[index]);
  });
  gameActive = false;
};

const paintGame = (state) => {
  statsBoard.style.display = 'block';

  document.addEventListener('keydown', handleKeyDown);

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const food = state.food;
  const gridSize = state.gridSize;
  const size = canvas.width / gridSize;

  ctx.fillStyle = FOOD_COLOR;
  ctx.fillRect(food.x * size, food.y * size, size, size);

  state.players.map((player, index) => {
    paintPlayer(player, size, playerColors[index]);
  });
};

const paintPlayer = (playerState, size, color) => {
  const player = playerState.pos;
  const playerStats = playerState.stats;

  if (playerState.id === playerNumber) {
    healthText.innerText = playerStats.health;
    powerText.innerText = playerStats.power;
    staminaText.innerText = playerStats.stamina;
  }

  if (playerState.alive) {
    ctx.fillStyle = color;
    ctx.fillRect(player.x * size, player.y * size, size, size);

    // Print health container
    ctx.fillStyle = 'gray';
    ctx.fillRect(player.x * size - 17, player.y * size - 12, 49, 8);

    const barConstant = 2.2727272727272727272727272727273;
    // Print health bar
    ctx.fillStyle = 'red';
    ctx.fillRect(
      player.x * size - 14,
      player.y * size - 10,
      44 - (44 - playerStats.health / barConstant),
      4
    );

    const nameConstant =
      playerState.username.length === 1
        ? 0
        : playerState.username.length * 4 - 4;

    // Print username
    ctx.font = '16px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(
      playerState.username,
      player.x * size + 4 - nameConstant,
      player.y * size + 34
    );
  }
};

const handleInit = (number) => {
  playerNumber = number;
};

let serverGameState;

const handleGameState = (gameState) => {
  serverGameState = JSON.parse(gameState);
  if (!gameActive) {
    init(serverGameState);
    return;
  }

  requestAnimationFrame(() => paintGame(serverGameState));
};

const handleGameStatus = (gameStatus) => {
  if (gameStatus === 'waiting') {
    currentStatus = 'Waiting...';
  } else if (gameStatus === 'started') {
    gameActive = true;
  } else {
    if (gameStatus === 1) {
      startVoteScreen.style.display = 'none';
    }
    currentStatus = `Starting in ${gameStatus}`;
    init(serverGameState);
  }
};
const handleGameCode = (gameCode) => {
  gameCodeDisplay.innerText = gameCode;
  roomName = gameCode;
};

const newGame = () => {
  const username = usernameInput.value;
  if (!username) {
    alert('Please enter your username');
  } else {
    socket.emit('newGame', username);
  }
};

const joinGame = () => {
  const code = gameCodeInput.value;
  const username = usernameInput.value;
  if (!code) {
    alert('Please enter game code');
  } else if (!username) {
    alert('Please enter your username');
  } else {
    socket.emit('joinGame', code, username);
  }
};

const handleGameOver = (data) => {
  if (!gameActive) {
    return;
  }
  data = JSON.parse(data);

  gameActive = false;

  if (data.winner.id === playerNumber) {
    alert('You Win!');
  } else {
    alert(`You Lose :( Winner is: ${data.winner.username}`);
  }

  reset();
};

const handleUnknownCode = () => {
  reset();
  alert('Unknown Game Code');
};

const handleTooManyPlayers = () => {
  reset();
  alert('This game is already in progress');
};

const handlePlayerCount = (numClients) => {
  playerCount = numClients;
  userCount.innerText = playerCount;
};

const handleVoteCount = (vote) => {
  currentVoteCount = vote;

  voteCount.innerText = `${currentVoteCount}/${playerCount}`;
};

const handleJoin = (joined) => {
  if (!joined) {
    alert('Game already started');
    reset();
  }
};

const reset = () => {
  playerNumber = null;
  roomName = null;
  gameActive = false;
  currentStatus = 'Waiting...';
  gameCodeInput.value = '';
  voteButton.classList.remove('voted');
  gameSection.style.display = 'none';
  statsBoard.style.display = 'none';
  initialScreen.style.display = 'block';
  startVoteScreen.style.display = 'flex';
};

voteButton.addEventListener('click', () => {
  if (playerCount >= 2) {
    socket.emit('startVote', roomName);
    voteButton.classList.add('voted');
  } else {
    alert(`You can't play alone :(`);
  }
});

newGameButton.addEventListener('click', newGame);
joinGameButton.addEventListener('click', joinGame);

socket.on('init', handleInit);
socket.on('gameState', handleGameState);
socket.on('gameStatus', handleGameStatus);
socket.on('gameOver', handleGameOver);
socket.on('gameCode', handleGameCode);
socket.on('unknownCode', handleUnknownCode);
socket.on('tooManyPlayers', handleTooManyPlayers);
socket.on('numClients', handlePlayerCount);
socket.on('voteCount', handleVoteCount);
socket.on('joined', handleJoin);
