fetch('https://match-card-game-6zfi.onrender.com/api/validate-room', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ roomCode: 'MATCH-4GBX' })
}).then(res => res.json()).then(console.log).catch(console.error);
