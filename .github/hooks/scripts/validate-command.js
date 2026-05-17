const blockedPatterns = [
  /\brm\s+-rf\b/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+clean\s+-fd\b/i,
  /\bRemove-Item\b.*\b-Recurse\b.*\b-Force\b/i,
  /\bDROP\s+DATABASE\b/i,
  /\bDROP\s+TABLE\b/i
];

const command = process.env.COMMAND || process.argv.slice(2).join(" ");

if (blockedPatterns.some((pattern) => pattern.test(command))) {
  console.error("Blocked potentially destructive command.");
  process.exit(1);
}

process.exit(0);
