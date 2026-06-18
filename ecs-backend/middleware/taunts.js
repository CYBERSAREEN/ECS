const crypto = require('crypto');

// NOTE: a real MAC address is never visible to a web server over HTTP/TLS —
// it's a link-layer detail that doesn't survive past the client's own router.
// "mac" here is a deterministic, IP-derived, purely cosmetic string for the
// joke message only. It is never stored as if it were real, and the admin
// panel never represents it as a genuine MAC.
function fakeMac(ip) {
  const hash = crypto.createHash('md5').update(String(ip || 'unknown')).digest('hex');
  return hash.slice(0, 12).match(/.{2}/g).join(':').toUpperCase();
}

const QUOTES = [
  "Seriously? Hacking a cyber security website? Oh come on man! — your IP is {ip}, MAC is {mac}.",
  "Bold move attacking a company whose entire job is catching people like you. IP {ip}, MAC {mac} — noted.",
  "Nice try, but we literally do this for a living. IP {ip}, MAC {mac}, logged and laughed at.",
  "You picked the one website with a team of pentesters watching. IP {ip}, MAC {mac} — hi there.",
  "That payload's cute. We've seen better in our own bug bounty reports. IP {ip}, MAC {mac}.",
  "Pro tip: attacking a security firm's own site is how you end up in our blog post. IP {ip}, MAC {mac}.",
  "Burp Suite, huh? We use that too — on people who do exactly this. IP {ip}, MAC {mac}.",
  "Achievement unlocked: Got Noticed Immediately. IP {ip}, MAC {mac}. Try harder next time.",
];

function buildTaunt(ip) {
  const mac = fakeMac(ip);
  const template = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  return template.replace('{ip}', ip || 'unknown').replace('{mac}', mac);
}

module.exports = { buildTaunt, fakeMac };
