const BASE_URL = process.env.WORD_RPG_BASE_URL || 'https://word-rpg.redfisharthur.workers.dev';
const WS_URL = BASE_URL.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:') + '/match';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

class Client {
  constructor(name, role, pet, level) {
    this.name = name;
    this.role = role;
    this.pet = pet;
    this.level = level;
    this.ws = null;
    this.queue = [];
    this.waiters = [];
  }

  async connect() {
    this.ws = new WebSocket(WS_URL);
    this.ws.addEventListener('message', (event) => {
      let message;
      try {
        message = JSON.parse(String(event.data));
      } catch {
        return;
      }
      const index = this.waiters.findIndex((w) => w.type === message.type);
      if (index >= 0) {
        const [waiter] = this.waiters.splice(index, 1);
        clearTimeout(waiter.timer);
        waiter.resolve(message);
      } else {
        this.queue.push(message);
      }
    });

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(this.name + ' WebSocket open timeout')), 10000);
      this.ws.addEventListener('open', () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      this.ws.addEventListener('error', () => {
        clearTimeout(timer);
        reject(new Error(this.name + ' WebSocket error'));
      }, { once: true });
    });

    this.send({
      type: 'join',
      profile: {
        name: this.name,
        role: this.role,
        pet: this.pet,
        level: this.level,
        rpg: {},
      },
    });
  }

  send(value) {
    this.ws.send(JSON.stringify(value));
  }

  waitFor(type, timeout = 15000) {
    const index = this.queue.findIndex((message) => message?.type === type);
    if (index >= 0) {
      const [message] = this.queue.splice(index, 1);
      return Promise.resolve(message);
    }
    return new Promise((resolve, reject) => {
      const waiter = { type, resolve, timer: null };
      waiter.timer = setTimeout(() => {
        this.waiters = this.waiters.filter((x) => x !== waiter);
        reject(new Error(this.name + ' timed out waiting for ' + type));
      }, timeout);
      this.waiters.push(waiter);
    });
  }

  close() {
    try { this.ws?.close(1000, 'test-complete'); } catch {}
  }
}

async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

const a = new Client('WEB-PK-A', 'warrior', 'fox', 12);
const b = new Client('WEB-PK-B', 'mage', 'owl', 27);

try {
  await a.connect();
  await a.waitFor('queued');
  await b.connect();

  const [matchedA, matchedB] = await Promise.all([
    a.waitFor('matched'),
    b.waitFor('matched'),
  ]);

  assert(matchedA.self?.profile?.level === 12, 'player A real level should reach PK');
  assert(matchedB.self?.profile?.level === 27, 'player B real level should reach PK');
  assert(Array.isArray(matchedA.hand) && matchedA.hand.length === 9, 'player A should receive 9 cards');
  assert(Array.isArray(matchedB.hand) && matchedB.hand.length === 9, 'player B should receive 9 cards');

  a.send({ type: 'quiz-start', selected: [0, 1, 2] });
  b.send({ type: 'quiz-start', selected: [0, 1, 2] });

  const [quizA, quizB] = await Promise.all([
    a.waitFor('quiz-started'),
    b.waitFor('quiz-started'),
  ]);

  assert(Array.isArray(quizA.questions) && quizA.questions.length === 5, 'player A should receive 5 questions');
  assert(Array.isArray(quizB.questions) && quizB.questions.length === 5, 'player B should receive 5 questions');

  // Server rejects impossible sub-4.3s answer batches.
  await delay(4700);

  a.send({ type: 'ready', answers: ['', '', '', '', ''] });
  b.send({ type: 'ready', answers: ['', '', '', '', ''] });

  const [battleA, battleB] = await Promise.all([
    a.waitFor('battle-result', 20000),
    b.waitFor('battle-result', 20000),
  ]);

  assert(Number(battleA.round) === 1, 'player A battle result should be round 1');
  assert(Number(battleB.round) === 1, 'player B battle result should be round 1');
  assert(Array.isArray(battleA.steps) && battleA.steps.length > 0, 'player A should receive battle animation steps after quiz');
  assert(Array.isArray(battleB.steps) && battleB.steps.length > 0, 'player B should receive battle animation steps after quiz');

  console.log('Original Web PK quiz -> battle-result: PASS');
} finally {
  a.close();
  b.close();
}
