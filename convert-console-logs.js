const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

const SRC_DIR = path.join(__dirname, 'src');

const JS_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx']);

const walk = (dir, files = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (JS_EXTS.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
};

const toStringExpr = (expr) => {
  return t.callExpression(t.identifier('String'), [expr]);
};

const isConsoleCall = (node) => {
  if (!t.isCallExpression(node)) return false;
  const callee = node.callee;
  if (!t.isMemberExpression(callee)) return false;
  if (!t.isIdentifier(callee.object, { name: 'console' })) return false;
  if (!t.isIdentifier(callee.property)) return false;
  return callee.property.name === 'log' || callee.property.name === 'error';
};

const shouldTransform = (args) => {
  if (args.length !== 1) return true;
  return !t.isStringLiteral(args[0]) && !t.isTemplateLiteral(args[0]);
};

const buildConcat = (args) => {
  if (args.length === 0) {
    return t.stringLiteral('');
  }
  let expr = toStringExpr(args[0]);
  for (let i = 1; i < args.length; i++) {
    expr = t.binaryExpression('+', t.binaryExpression('+', expr, t.stringLiteral(' ')), toStringExpr(args[i]));
  }
  return expr;
};

const files = walk(SRC_DIR);

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'unambiguous',
      plugins: [
        'jsx',
        'classProperties',
        'optionalChaining',
        'nullishCoalescingOperator',
        'objectRestSpread',
        'dynamicImport'
      ]
    });
  } catch (err) {
    console.error('Parse failed:', file, err.message);
    continue;
  }

  let changed = false;

  traverse(ast, {
    CallExpression(path) {
      const node = path.node;
      if (!isConsoleCall(node)) return;
      const args = node.arguments;
      if (!shouldTransform(args)) return;
      const newArg = buildConcat(args);
      node.arguments = [newArg];
      changed = true;
    }
  });

  if (changed) {
    const output = generate(ast, { retainLines: true }, code).code;
    fs.writeFileSync(file, output, 'utf8');
  }
}

console.log('Console log normalization complete.');
