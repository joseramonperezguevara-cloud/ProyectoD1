/* script.js
Lógica del juego de memoria con contador de fallos.
*/

const EMOJIS = ['🍇','🍆','🍒','🍉','🍓','🍑'];

// DOM elements
const board = document.getElementById('board');
const attemptsSpan = document.getElementById('attempts');
const errorsSpan = document.getElementById('errors');
const timerSpan = document.getElementById('timer');
const restartBtn = document.getElementById('restart');
const message = document.getElementById('message');
const finalAttempts = document.getElementById('final-attempts');
const finalTime = document.getElementById('final-time');
const playAgainBtn = document.getElementById('play-again');

let cards = [];
let flipped = [];
let matchedCount = 0;
let attempts = 0;
let errors = 0;
let timer = 60;
let timerId = null;
let timerStarted = false;

function createDeck(){
  const deck = [];
  EMOJIS.forEach((e, i) => {
    deck.push({value: i, face: e});
    deck.push({value: i, face: e});
  });
  return deck;
}

function shuffle(array){
  for(let i = array.length -1; i>0; i--){
    const j = Math.floor(Math.random() * (i+1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function renderBoard(){
  board.innerHTML = '';
  cards.forEach((c, idx) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-value', c.value);
    card.setAttribute('data-index', idx);
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-front">${c.face}</div>
        <div class="card-face card-back">❓</div>
      </div>
    `;
    card.addEventListener('click', onCardClick);
    board.appendChild(card);
  });
}

function startGame(){
  clearInterval(timerId);
  timer = 60;
  timerSpan.textContent = timer;
  timerId = null;
  timerStarted = false;

  attempts = 0;
  attemptsSpan.textContent = attempts;

  errors = 0;
  errorsSpan.textContent = errors;

  flipped = [];
  matchedCount = 0;

  const deck = createDeck();
  shuffle(deck);
  cards = deck;
  renderBoard();
  hideMessage();
}

function showMessage(){
  finalAttempts.textContent = attempts;
  finalTime.textContent = timer;
  message.classList.remove('hidden');
}

function hideMessage(){
  message.classList.add('hidden');
}

function onCardClick(e){
  const cardEl = e.currentTarget;
  if(cardEl.classList.contains('matched') || cardEl.classList.contains('flipped')) return;

  if(!timerStarted){
    timerStarted = true;
    timerId = setInterval(() => {
      timer--;
      timerSpan.textContent = timer;
      if(timer <= 0){
        clearInterval(timerId);
        timer = 0;
        timerSpan.textContent = 0;
        flipAllThenReshuffle();
      }
    }, 1000);
  }

  cardEl.classList.add('flipped');
  const index = Number(cardEl.getAttribute('data-index'));
  flipped.push({index, el: cardEl});

  if(flipped.length === 2){
    attempts++;
    attemptsSpan.textContent = attempts;

    const [a, b] = flipped;
    const valA = cards[a.index].value;
    const valB = cards[b.index].value;

    if(valA === valB){
      a.el.classList.add('matched');
      b.el.classList.add('matched');
      matchedCount += 2;
      flipped = [];

      if(matchedCount === cards.length){
        clearInterval(timerId);
        showMessage();
      }
    } else {
      errors++;
      errorsSpan.textContent = errors;

      setTimeout(() => {
        a.el.classList.remove('flipped');
        b.el.classList.remove('flipped');
        flipped = [];
      }, 700);
    }
  }
}

function flipAllThenReshuffle(){
  const cardEls = document.querySelectorAll('.card');
  cardEls.forEach(c => c.classList.add('flipped'));

  setTimeout(() => {
    cardEls.forEach(c => {
      c.classList.remove('flipped');
      c.classList.remove('matched');
    });
    startGame();
  }, 1500);
}

restartBtn.addEventListener('click', () => {
  startGame();
});

playAgainBtn.addEventListener('click', () => {
  hideMessage();
  startGame();
});

startGame();
