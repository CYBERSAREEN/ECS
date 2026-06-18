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

// Third-person versions shown to OTHER visitors browsing the site while an
// attack is being caught in real time — a live "yes, this is actually
// working" demo, not aimed at the attacker. Deliberately says nothing about
// what the payload was or which rule caught it (that's exactly the kind of
// detail you don't hand to whoever's watching the page).
const PUBLIC_QUOTES = [
  "Someone's trying to hack us right now — IP {ip}, MAC {mac}. Bold strategy, let's see how it works out for them.",
  "Live attack in progress from IP {ip} (MAC {mac}). Our team's having a good laugh over here.",
  "Heads up: we're currently fending off an attack from IP {ip}, MAC {mac}. Honestly? Not their best work.",
  "Someone at IP {ip} (MAC {mac}) just tried something on us. We caught it before it left the driveway.",
  "Attack detected from IP {ip}, MAC {mac} — but I doubt their experience matches their enthusiasm.",
  "Plot twist: IP {ip} (MAC {mac}) picked a cybersecurity company to test their skills on. Bold. Wrong, but bold.",
];

function buildPublicQuote(ip) {
  const mac = fakeMac(ip);
  const template = PUBLIC_QUOTES[Math.floor(Math.random() * PUBLIC_QUOTES.length)];
  return template.replace('{ip}', ip || 'unknown').replace('{mac}', mac);
}

module.exports = { buildTaunt, buildPublicQuote, fakeMac };
