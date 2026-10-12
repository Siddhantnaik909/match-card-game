import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GameEngine, InternalRoom } from './gameEngine';
import { storage } from './storage';

const engines: GameEngine[] = [];

function makeRoom(): InternalRoom {
  const engine = new GameEngine();
  engines.push(engine);
  const created = engine.createRoom('Asha', 'match-and-collect', undefined as never);
  assert.ok(!('error' in created));
  const room = created.room;

  for (const name of ['Bina', 'Chirag', 'Dev']) {
    const joined = engine.joinRoom(room.roomCode, name, undefined as never);
    assert.ok(!('error' in joined));
  }

  room.status = 'in-progress';
  room.roundStartedAt = Date.now();
  return room;
}

function deal(player: InternalRoom['players'][number], types: string[]) {
  player.hand = types.map((type, index) => ({ id: `${player.id}-${index}`, type }));
}

function checkMatches(engine: GameEngine, room: InternalRoom): boolean {
  return (engine as unknown as {
    checkForMatchAndCollectWinner: (gameRoom: InternalRoom) => boolean;
  }).checkForMatchAndCollectWinner(room);
}

test('first match locks that hand, then the remaining players keep passing without final results', async () => {
  const room = makeRoom();
  const gameEngine = engines.at(-1)!;

  deal(room.players[0], ['laptop', 'laptop', 'laptop', 'laptop']);
  deal(room.players[1], ['coffee', 'coffee', 'coffee', 'plant']);
  deal(room.players[2], ['plant', 'plant', 'phone', 'phone']);
  deal(room.players[3], ['headphones', 'headphones', 'pen', 'pen']);

  assert.equal(checkMatches(gameEngine, room), false);
  assert.equal(room.status, 'in-progress');
  assert.equal(room.players[0].hasFinished, true);
  assert.equal(room.players[0].matchRank, 1);
  assert.equal(room.players.slice(1).every((player) => !player.hasFinished), true);
  assert.equal(room.lastMatchResults, undefined);

  const publicState = gameEngine.getPublicRoomState(room);
  assert.equal(publicState.players[0].status, 'winner');
  assert.equal(publicState.players[1].status, 'selecting');

  assert.equal(gameEngine.selectCard(room.roomCode, room.players[0].id, room.players[0].hand[0].id).success, false);
  assert.equal(gameEngine.selectCard(room.roomCode, room.players[1].id, room.players[1].hand[0].id).success, true);

  for (const player of room.players.slice(1)) {
    assert.equal(gameEngine.selectCard(room.roomCode, player.id, player.hand[0].id).success, true);
    assert.equal(gameEngine.passCard(room.roomCode, player.id).success, true);
  }

  await new Promise((resolve) => setTimeout(resolve, 1450));
  if (room.passTimer) clearInterval(room.passTimer);

  assert.equal(room.status, 'in-progress');
  assert.equal(room.phase, 'select');
  assert.equal(room.passesInRound, 1);
  assert.equal(room.players.slice(1).every((player) => player.hand.length === 4), true);
  assert.equal(room.lastMatchResults, undefined);
});

test('final results are saved only after every player has matched', () => {
  const room = makeRoom();
  const engine = engines.at(-1)!;
  for (const [index, player] of room.players.entries()) {
    const type = ['laptop', 'coffee', 'plant', 'phone'][index];
    deal(player, [type, type, type, type]);
  }

  const originalRecordMatchResult = storage.recordMatchResult;
  let savedResults = 0;
  storage.recordMatchResult = () => { savedResults += 1; };
  try {
    assert.equal(checkMatches(engine, room), true);
    assert.equal(room.status, 'round-ended');
    assert.equal(room.lastMatchResults?.length, room.players.length);
    assert.equal(room.lastMatchResults?.every((result) => result.matchProgress.includes('(Matched!)')), true);
    assert.equal(savedResults, 1);
  } finally {
    storage.recordMatchResult = originalRecordMatchResult;
  }
});
