import WebSocket from 'ws';

const baseUrl = process.env.WORD_RPG_BASE_URL || 'https://word-rpg.redfisharthur.workers.dev';
const wsUrl = baseUrl.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:') + '/match';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class TestClient {
  constructor(name, role, pet) {
    this.name = name;
    this.role = role;
    this.pet = pet;
    this.messages = [];
    this.waiters = [];
    this.socket = null;
  }

  async connect() {
    this.socket = new WebSocket(wsUrl);
    this.socket.on('message', (raw) => {
      let message;
      try {
        message = JSON.parse(String(raw));
      } catch {
        return;
      }
      this.messages.push(message);
      const remaining = [];
      for (const waiter of this.waiters) {
        if (waiter.predicate(message)) {
          clearTimeout(waiter.timer);
          waiter.resolve(message);
        } else {
          remaining.push(waiter);
        }
      }
      this.waiters = remaining;
    });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`${this.name} WebSocket open timeout`)), 10000);
      this.socket.once('open', () => {
        clearTimeout(timer);
        resolve();
      });
      this.socket.once('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
    this.send({
      type: 'join',
      profile: {
        name: this.name,
        role: this.role,
        pet: this.pet,
        level: 50,
        rpg: {},
      },
    });
  }

  send(value) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error(`${this.name} socket is not open`);
    }
    this.socket.send(JSON.stringify(value));
  }

  waitFor(type, timeoutMs = 15000) {
    const existingIndex = this.messages.findIndex((message) => message?.type === type);
    if (existingIndex >= 0) {
      const [message] = this.messages.splice(existingIndex, 1);
      return Promise.resolve(message);
    }
    return new Promise((resolve, reject) => {
      const waiter = {
        predicate: (message) => message?.type === type,
        resolve,
        timer: null,
      };
      waiter.timer = setTimeout(() => {
        this.waiters = this.waiters.filter((entry) => entry !== waiter);
        reject(new Error(`${this.name} timed out waiting for ${type}; seen: ${this.messages.map((m) => m?.type).join(', ')}`));
      }, timeoutMs);
      this.waiters.push(waiter);
    });
  }

  close() {
    try {
      this.socket?.close(1000, 'test-complete');
    } catch {}
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function verifyHttp() {
  const sessionResponse = await fetch(baseUrl + '/api/session');
  assert(sessionResponse.ok, `/api/session returned ${sessionResponse.status}`);
  const session = await sessionResponse.json();
  assert(session && typeof session === 'object', '/api/session should return JSON');
  assert(session.authenticated === false, 'anonymous production smoke should not be authenticated');

  const questionsResponse = await fetch(baseUrl + '/api/questions?count=10');
  assert(questionsResponse.ok, `/api/questions returned ${questionsResponse.status}`);
  const questions = await questionsResponse.json();
  assert(Array.isArray(questions.indices), '/api/questions should return indices');
  assert(questions.indices.length === 10, '/api/questions should return ten indices');
  assert(new Set(questions.indices).size === 10, '/api/questions indices should be unique');
  assert(questions.indices.every((value) => Number.isInteger(value) && value >= 0 && value < 1200), '/api/questions indices should be in range');

  const authResponse = await fetch(baseUrl + '/auth/line', { redirect: 'manual' });
  assert([302, 303, 307, 308, 503].includes(authResponse.status), `/auth/line unexpected status ${authResponse.status}`);
  if (authResponse.status !== 503) {
    const location = authResponse.headers.get('location') || '';
    assert(location.includes('access.line.me'), '/auth/line should redirect to LINE');
  }
}

async function startQuiz(client, selected) {
  client.send({ type: 'quiz-start', selected });
  const started = await client.waitFor('quiz-started');
  assert(Array.isArray(started.questions) && started.questions.length === 5, `${client.name} should receive five PK questions`);
  return started;
}

async function finishRound(a, b, selectedA, selectedB) {
  await Promise.all([startQuiz(a, selectedA), startQuiz(b, selectedB)]);
  // Worker validation requires the five-question interaction to last at least 4.3 s.
  await delay(4700);
  a.send({ type: 'ready', answers: ['', '', '', '', ''] });
  b.send({ type: 'ready', answers: ['', '', '', '', ''] });
  const [resultA, resultB] = await Promise.all([
    a.waitFor('battle-result', 20000),
    b.waitFor('battle-result', 20000),
  ]);
  assert(Array.isArray(resultA.steps), 'player A should receive battle steps');
  assert(Array.isArray(resultB.steps), 'player B should receive battle steps');
  assert(resultA.self?.profile?.name === a.name, 'player A self profile should round-trip');
  assert(resultB.self?.profile?.name === b.name, 'player B self profile should round-trip');
  assert(resultA.opponent?.profile?.name === b.name, 'player A opponent profile should round-trip');
  assert(resultB.opponent?.profile?.name === a.name, 'player B opponent profile should round-trip');
  return [resultA, resultB];
}

async function verifyPk() {
  const a = new TestClient('E2E-A', 'warrior', 'fox');
  const b = new TestClient('E2E-B', 'mage', 'owl');
  try {
    await a.connect();
    await a.waitFor('queued');
    await b.connect();

    const [matchedA, matchedB] = await Promise.all([
      a.waitFor('matched'),
      b.waitFor('matched'),
    ]);
    assert(Array.isArray(matchedA.hand) && matchedA.hand.length === 9, 'player A should receive nine PK cards');
    assert(Array.isArray(matchedB.hand) && matchedB.hand.length === 9, 'player B should receive nine PK cards');
    assert(matchedA.self?.profile?.role === 'warrior', 'player A role should round-trip');
    assert(matchedB.self?.profile?.role === 'mage', 'player B role should round-trip');

    let [resultA, resultB] = await finishRound(a, b, [0, 1, 2], [0, 1, 2]);
    assert(resultA.finished === resultB.finished, 'both clients should agree whether PK is finished');

    if (!resultA.finished) {
      [resultA, resultB] = await finishRound(a, b, [3, 4, 5], [3, 4, 5]);
    }

    assert(resultA.finished === true && resultB.finished === true, 'PK should finish no later than round two');
    assert(['self', 'opponent', 'draw'].includes(resultA.winner), 'player A should receive a valid PK winner');
    assert(['self', 'opponent', 'draw'].includes(resultB.winner), 'player B should receive a valid PK winner');
    console.log('Live two-client PK smoke: PASS');
  } finally {
    a.close();
    b.close();
  }
}

await verifyHttp();
console.log('Live HTTP/API smoke: PASS');
await verifyPk();
console.log('Live production integration: PASS');
