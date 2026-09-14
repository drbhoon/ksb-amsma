// Generate the values for ADMIN_PASSWORD_HASH and SESSION_SECRET.
//
//   node scripts/hash-admin-password.mjs
//
// Prompts without echoing, so the password never lands in shell history.
import crypto from 'crypto';
import readline from 'readline';

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const onData = (char) => {
      if (['\n', '\r', '\u0004'].includes(char.toString('utf8'))) process.stdin.pause();
      else process.stdout.write('*');
    };
    process.stdout.write(question);
    process.stdin.on('data', onData);
    rl.question('', (answer) => {
      process.stdin.removeListener('data', onData);
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

const pw = (await ask('Choose an admin password: ')).trim();
if (pw.length < 12) {
  console.error('\nToo short. Use at least 12 characters - this is the only thing standing\nbetween the public and the Association\'s content.');
  process.exit(1);
}
const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(pw, salt, 64);

console.log('\nSet these two variables (the password itself is never stored):\n');
console.log(`ADMIN_PASSWORD_HASH=${salt.toString('hex')}:${hash.toString('hex')}`);
console.log(`SESSION_SECRET=${crypto.randomBytes(32).toString('base64url')}`);
console.log('\nRailway:');
console.log("  railway variables --set 'ADMIN_PASSWORD_HASH=...' --set 'SESSION_SECRET=...' --service ksb-amsma");
