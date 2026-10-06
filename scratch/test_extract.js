const rawRoomCode = "MATCH-4GBX";
const urlMatch = rawRoomCode.match(/[?&]room=([^&]+)/i);
let code = rawRoomCode;
if (urlMatch && urlMatch[1]) {
  code = urlMatch[1];
} else {
  code = code.replace(/.*onrender\.com\/?/i, '');
}

let cleanRoomCode = code.toUpperCase().replace(/\s+/g, '-');

if (!cleanRoomCode.startsWith('MATCH-') && /^[A-Z0-9]{4,6}$/.test(cleanRoomCode)) {
  cleanRoomCode = `MATCH-${cleanRoomCode}`;
}

const matches = Array.from(cleanRoomCode.matchAll(/MATCH-[A-Z0-9]{4,6}/g));
if (matches.length > 0) {
  cleanRoomCode = matches[matches.length - 1][0];
}

console.log("FINAL:", cleanRoomCode);
