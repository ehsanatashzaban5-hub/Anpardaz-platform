import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const roots = ['apps', 'services', 'packages'];
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const ignored = new Set(['node_modules', 'dist', 'build', '.next', 'coverage']);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (extensions.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

// This gate deliberately scans runtime source only. Tests/fixtures may legitimately
// contain mocks; production code must not contain mock/fake/demo data paths.
const files = roots.flatMap(root => walk(path.join(ROOT, root)));
const banned = [
  /\bmock(?:ed|ing|s)?\b/i,
  /\bfake(?:d|s)?\b/i,
  /\bdummy\b/i,
  /\bfixture(?:s)?\b/i,
  /\b(?:mock|fake|dummy|sample|demo)(?:_|-)?data\b/i,
  /\bMath\.random\s*\(/,
  /\b(?:localhost|127\.0\.0\.1)\b/,
];
const findings = [];

function stripComments(line) {
  return line
    .replace(/\/\/.*$/g, '')
    .replace(/\/\*.*?\*\//g, '');
}

for (const file of files) {
  const relative = path.relative(ROOT, file);
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((raw, index) => {
    const line = stripComments(raw);
    if (!line.trim()) return;
    for (const pattern of banned) {
      if (pattern.test(line)) {
        findings.push({ file: relative, line: index + 1, text: raw.trim().slice(0, 240), rule: pattern.source });
        break;
      }
    }
  });
}

if (findings.length) {
  console.error('RUNTIME MOCK/BYPASS GATE FAILED');
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} [${finding.rule}] ${finding.text}`);
  }
  process.exit(1);
}
console.log(`Runtime mock/bypass gate passed: scanned ${files.length} source files.`);
