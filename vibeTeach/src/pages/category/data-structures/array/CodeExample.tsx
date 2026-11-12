// CodeExample.tsx - Interactive Array Learning Experience
import { useState, useCallback, useMemo } from 'react';
import CodeMirrorEditor from './CodeMirrorEditor';
import styles from './CodeExample.module.scss';

// ─── Operation definitions ───────────────────────────────────────────────────

interface TestCase {
  input: string;
  expected: string;
  invoke: string;          // JS expression that calls the user function
}

interface Operation {
  id: string;
  title: string;
  description: string;
  skeleton: string;
  tests: TestCase[];
  answer: string;
}

const operations: Operation[] = [
  {
    id: 'access',
    title: 'Access by Index',
    description: 'Return the element at the given index. If the index is out of bounds, return undefined.',
    skeleton: `function accessByIndex(arr, index) {\n  // your code here\n}`,
    tests: [
      { input: 'accessByIndex([10, 20, 30], 0)', expected: '10', invoke: 'accessByIndex([10, 20, 30], 0)' },
      { input: 'accessByIndex([10, 20, 30], 2)', expected: '30', invoke: 'accessByIndex([10, 20, 30], 2)' },
      { input: 'accessByIndex([10, 20, 30], 5)', expected: 'undefined', invoke: 'accessByIndex([10, 20, 30], 5)' },
    ],
    answer: `function accessByIndex(arr, index) {\n  return arr[index];\n}`,
  },
  {
    id: 'search',
    title: 'Search (value)',
    description: 'Return the index of the value in the array, or -1 if not found.',
    skeleton: `function searchValue(arr, value) {\n  // return index or -1\n}`,
    tests: [
      { input: 'searchValue([1, 2, 3], 2)', expected: '1', invoke: 'searchValue([1, 2, 3], 2)' },
      { input: 'searchValue([1, 2, 3], 5)', expected: '-1', invoke: 'searchValue([1, 2, 3], 5)' },
      { input: 'searchValue([], 1)', expected: '-1', invoke: 'searchValue([], 1)' },
    ],
    answer: `function searchValue(arr, value) {\n  for (let i = 0; i < arr.length; i++) {\n    if (arr[i] === value) return i;\n  }\n  return -1;\n}`,
  },
  {
    id: 'push',
    title: 'Insert at End (push)',
    description: 'Add the value to the end of the array and return the new array.',
    skeleton: `function insertAtEnd(arr, value) {\n  // your code here\n}`,
    tests: [
      { input: 'insertAtEnd([1, 2], 3)', expected: '[1,2,3]', invoke: 'JSON.stringify(insertAtEnd([1, 2], 3))' },
      { input: 'insertAtEnd([], 1)', expected: '[1]', invoke: 'JSON.stringify(insertAtEnd([], 1))' },
    ],
    answer: `function insertAtEnd(arr, value) {\n  arr.push(value);\n  return arr;\n}`,
  },
  {
    id: 'pop',
    title: 'Remove from End (pop)',
    description: 'Remove the last element from the array and return the modified array.',
    skeleton: `function removeFromEnd(arr) {\n  // your code here\n}`,
    tests: [
      { input: 'removeFromEnd([1, 2, 3])', expected: '[1,2]', invoke: 'JSON.stringify(removeFromEnd([1, 2, 3]))' },
      { input: 'removeFromEnd([1])', expected: '[]', invoke: 'JSON.stringify(removeFromEnd([1]))' },
    ],
    answer: `function removeFromEnd(arr) {\n  arr.pop();\n  return arr;\n}`,
  },
  {
    id: 'unshift',
    title: 'Insert at Beginning (unshift)',
    description: 'Add the value to the beginning of the array and return the new array.',
    skeleton: `function insertAtBeginning(arr, value) {\n  // your code here\n}`,
    tests: [
      { input: 'insertAtBeginning([2, 3], 1)', expected: '[1,2,3]', invoke: 'JSON.stringify(insertAtBeginning([2, 3], 1))' },
      { input: 'insertAtBeginning([], 1)', expected: '[1]', invoke: 'JSON.stringify(insertAtBeginning([], 1))' },
    ],
    answer: `function insertAtBeginning(arr, value) {\n  arr.unshift(value);\n  return arr;\n}`,
  },
  {
    id: 'shift',
    title: 'Remove from Beginning (shift)',
    description: 'Remove the first element from the array and return the modified array.',
    skeleton: `function removeFromBeginning(arr) {\n  // your code here\n}`,
    tests: [
      { input: 'removeFromBeginning([1, 2, 3])', expected: '[2,3]', invoke: 'JSON.stringify(removeFromBeginning([1, 2, 3]))' },
      { input: 'removeFromBeginning([1])', expected: '[]', invoke: 'JSON.stringify(removeFromBeginning([1]))' },
    ],
    answer: `function removeFromBeginning(arr) {\n  arr.shift();\n  return arr;\n}`,
  },
  {
    id: 'insertAt',
    title: 'Insert at Index',
    description: 'Insert the value at the given index, shifting existing elements to the right. Return the modified array.',
    skeleton: `function insertAt(arr, index, value) {\n  // your code here\n}`,
    tests: [
      { input: 'insertAt([1, 3], 1, 2)', expected: '[1,2,3]', invoke: 'JSON.stringify(insertAt([1, 3], 1, 2))' },
      { input: 'insertAt([2, 3], 0, 1)', expected: '[1,2,3]', invoke: 'JSON.stringify(insertAt([2, 3], 0, 1))' },
    ],
    answer: `function insertAt(arr, index, value) {\n  arr.splice(index, 0, value);\n  return arr;\n}`,
  },
  {
    id: 'deleteAt',
    title: 'Delete at Index',
    description: 'Remove the element at the given index and return the modified array.',
    skeleton: `function deleteAt(arr, index) {\n  // your code here\n}`,
    tests: [
      { input: 'deleteAt([1, 2, 3], 1)', expected: '[1,3]', invoke: 'JSON.stringify(deleteAt([1, 2, 3], 1))' },
      { input: 'deleteAt([1, 2, 3], 0)', expected: '[2,3]', invoke: 'JSON.stringify(deleteAt([1, 2, 3], 0))' },
    ],
    answer: `function deleteAt(arr, index) {\n  arr.splice(index, 1);\n  return arr;\n}`,
  },
];

// ─── Allowed globals / built-ins ─────────────────────────────────────────────

const ALLOWED_GLOBALS = new Set([
  'console', 'Math', 'Array', 'Object', 'JSON', 'String', 'Number', 'Boolean',
  'parseInt', 'parseFloat', 'isNaN', 'Infinity', 'NaN', 'undefined', 'null',
  'true', 'false', 'length',
  // standard array methods (allowed as standalone identifiers for autocomplete / lenient checking)
  'push', 'pop', 'shift', 'unshift', 'splice', 'slice', 'indexOf', 'includes',
  'map', 'filter', 'reduce', 'forEach', 'concat', 'join', 'sort', 'reverse',
  'find', 'findIndex', 'some', 'every',
  // common built-ins you might use
  'Error', 'TypeError', 'RangeError', 'console', 'Date', 'RegExp', 'Promise',
  'Set', 'Map', 'Symbol', 'WeakMap', 'WeakSet', 'Proxy', 'Reflect',
]);

// ─── Validation helpers ──────────────────────────────────────────────────────

interface ValidationError {
  type: 'syntax' | 'undeclared' | 'undefined-call';
  message: string;
  line?: number;
}

/**
 * Extract declared identifiers from code.
 * Catches var/let/const declarations, function declarations, and function parameters.
 */
function extractDeclaredNames(code: string): Set<string> {
  const declared = new Set<string>();

  // Function declarations: function foo(...)
  for (const m of code.matchAll(/\bfunction\s+([a-zA-Z_$][\w$]*)/g)) {
    declared.add(m[1]);
  }

  // var/let/const declarations (simple: handles single and comma-separated)
  for (const m of code.matchAll(/\b(?:var|let|const)\s+([a-zA-Z_$][\w$]*)/g)) {
    declared.add(m[1]);
  }

  // Also handle destructuring or comma-separated: var a, b, c
  // We'll do a broader sweep: find all var/let/const ... lines and extract identifiers
  for (const m of code.matchAll(/\b(?:var|let|const)\s+([\s\S]*?)(?:;|$|(?=\n(?:var|let|const|function|\}|$)))/g)) {
    const decl = m[1];
    for (const id of decl.matchAll(/\b([a-zA-Z_$][\w$]*)\b/g)) {
      declared.add(id[1]);
    }
  }

  // Function parameters: function foo(a, b) { ... } or arrow (a, b) => ...
  for (const m of code.matchAll(/function\s*[^(]*\(([^)]*)\)/g)) {
    const params = m[1];
    for (const p of params.split(',')) {
      const name = p.trim().replace(/^(\.\.\.|…)/, '').split(/[\s=:]/)[0];
      if (name) declared.add(name);
    }
  }

  // For-in / for-of loop variables: for (const x of ...)
  for (const m of code.matchAll(/\bfor\s*\(\s*(?:var|let|const)\s+([a-zA-Z_$][\w$]*)/g)) {
    declared.add(m[1]);
  }

  // catch(e) ...
  for (const m of code.matchAll(/\bcatch\s*\(\s*([a-zA-Z_$][\w$]*)/g)) {
    declared.add(m[1]);
  }

  return declared;
}

/**
 * Extract all used identifiers from code (excluding keywords and string literals).
 */
function extractUsedIdentifiers(code: string): Set<string> {
  const used = new Set<string>();

  // Strip string literals to avoid false positives
  let stripped = code;
  stripped = stripped.replace(/"(?:[^"\\]|\\.)*"/g, '""');
  stripped = stripped.replace(/'(?:[^'\\]|\\.)*'/g, "''");
  stripped = stripped.replace(/`(?:[^`\\]|\\.)*`/g, '``');
  // Strip comments
  stripped = stripped.replace(/\/\/.*$/gm, '');
  stripped = stripped.replace(/\/\*[\s\S]*?\*\//g, '');

  const keywords = new Set([
    'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case',
    'break', 'continue', 'new', 'this', 'class', 'extends', 'super', 'try',
    'catch', 'finally', 'throw', 'typeof', 'instanceof', 'void', 'delete',
    'in', 'of', 'yield', 'async', 'await', 'export', 'import', 'default', 'from',
    'var', 'let', 'const', 'static', 'get', 'set',
  ]);

  for (const m of stripped.matchAll(/\b([a-zA-Z_$][\w$]*)\b/g)) {
    const id = m[1];
    if (!keywords.has(id)) {
      used.add(id);
    }
  }

  return used;
}

/**
 * Extract function names defined in the code (so they can be called).
 */
function extractDefinedFunctions(code: string): Set<string> {
  const fns = new Set<string>();
  for (const m of code.matchAll(/\bfunction\s+([a-zA-Z_$][\w$]*)/g)) {
    fns.add(m[1]);
  }
  // Arrow functions / const fn = (...) => ...  / const fn = function(...)
  for (const m of code.matchAll(/\b(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*(?:function|\()/g)) {
    fns.add(m[1]);
  }
  return fns;
}

/**
 * Validate user code and return an array of issues.
 */
function validateCode(code: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1) Syntax check
  try {
    // eslint-disable-next-line no-new-func
    new Function(code);
  } catch (err: any) {
    const msg = err.message || String(err);
    let line: number | undefined;
    const lineMatch = msg.match(/line\s+(\d+)/i) || msg.match(/:(\d+):\d+/) || msg.match(/position\s+(\d+)/i);
    if (lineMatch) {
      line = parseInt(lineMatch[1], 10);
    }
    // If no line from message, try to find it from the error description
    if (line === undefined && err.lineNumber !== undefined) {
      line = err.lineNumber;
    }
    errors.push({
      type: 'syntax',
      message: msg,
      line,
    });
    // Don't do further checks if there's a syntax error — the AST is broken
    return errors;
  }

  // 2) Undeclared variable / undefined function checks
  const declared = extractDeclaredNames(code);
  const definedFns = extractDefinedFunctions(code);
  const used = extractUsedIdentifiers(code);

  // Build the full set of "known" identifiers
  const known = new Set([...declared, ...definedFns, ...ALLOWED_GLOBALS]);

  for (const id of sortedSet(used)) {
    if (!known.has(id)) {
      // Check if it looks like a method call (preceded by .) — these are fine
      const methodPattern = new RegExp(`\\.${id}\\b`);
      if (methodPattern.test(code)) {
        continue; // likely a method call on an object, skip
      }
      errors.push({
        type: 'undeclared',
        message: `"${id}" is used but never declared`,
      });
    }
  }

  return errors;
}

function sortedSet(s: Set<string>): string[] {
  return [...s].sort();
}

// ─── Test result types ───────────────────────────────────────────────────────

interface TestResult {
  label: string;
  passed: boolean;
  expected: string;
  got: string;
}

// ─── Single operation card ───────────────────────────────────────────────────

interface OperationCardProps {
  op: Operation;
}

const OperationCard: React.FC<OperationCardProps> = ({ op }) => {
  const [code, setCode] = useState(op.skeleton);
  const [expanded, setExpanded] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[] | null>(null);

  // Update the CodeMirror lint diagnostics source
  const diagnostics = useMemo(() => {
    if (!validationErrors) return [];
    return validationErrors.map((err) => ({
      from: 0,
      to: code.length,
      severity: err.type === 'syntax' ? ('error' as const) : ('warning' as const),
      message: err.message,
    }));
  }, [validationErrors, code]);

  const runTests = useCallback(() => {
    // First-pass validation
    const errors = validateCode(code);
    setValidationErrors(errors);

    // If there are syntax errors, block test execution
    const hasSyntaxErrors = errors.some((e) => e.type === 'syntax');
    if (hasSyntaxErrors) {
      setResults(null);
      return;
    }

    // Run the tests
    const testResults: TestResult[] = op.tests.map((t) => {
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function(`${code}\nreturn ${t.invoke};`);
        const got = fn();
        const gotStr = typeof got === 'undefined' ? 'undefined' : String(got);
        return {
          label: t.input,
          passed: gotStr === t.expected,
          expected: t.expected,
          got: gotStr,
        };
      } catch (err: any) {
        return {
          label: t.input,
          passed: false,
          expected: t.expected,
          got: `Error: ${err.message}`,
        };
      }
    });
    setResults(testResults);
  }, [code, op.tests]);

  // Reset tests when code changes back to skeleton
  const resetCode = useCallback(() => {
    setCode(op.skeleton);
    setResults(null);
    setValidationErrors(null);
  }, [op.skeleton]);

  // Clear validation errors when code changes
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    if (validationErrors) {
      setValidationErrors(null);
    }
  }, [validationErrors]);

  const hasSyntaxErrors = validationErrors?.some((e) => e.type === 'syntax') ?? false;
  const hasWarnings = validationErrors?.some((e) => e.type !== 'syntax') ?? false;

  return (
    <div className={styles.operationCard}>
      <button
        className={styles.accordionHeader}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className={styles.accordionIcon}>{expanded ? '▼' : '▶'}</span>
        <span className={styles.accordionTitle}>{op.title}</span>
        {results && !hasSyntaxErrors && (
          <span className={results.every((r) => r.passed) ? styles.badgePass : styles.badgeFail}>
            {results.filter((r) => r.passed).length}/{results.length} passed
          </span>
        )}
        {validationErrors && hasSyntaxErrors && (
          <span className={styles.badgeError}>⚠ syntax error</span>
        )}
      </button>

      {expanded && (
        <div className={styles.accordionBody}>
          <p className={styles.description}>{op.description}</p>
          <CodeMirrorEditor
            value={code}
            onChange={handleCodeChange}
            height="160px"
            diagnostics={diagnostics}
          />
          <div className={styles.buttonRow}>
            <button className={styles.testButton} onClick={runTests}>
              ▶ Run Tests
            </button>
            <button className={styles.resetButton} onClick={resetCode}>
              ↺ Reset
            </button>
          </div>

          {/* Validation errors panel */}
          {validationErrors && validationErrors.length > 0 && (
            <div className={styles.errorsPanel}>
              <div className={styles.errorsHeader}>
                ⚠ {hasSyntaxErrors ? 'Syntax Error' : 'Issues found'}
              </div>
              <ul className={styles.errorsList}>
                {validationErrors.map((err, i) => (
                  <li key={i} className={err.type === 'syntax' ? styles.errorSyntax : styles.errorWarning}>
                    {err.line !== undefined && <span className={styles.errorLine}>Line {err.line}: </span>}
                    {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Test results */}
          {results && !hasSyntaxErrors && (
            <div className={styles.testResults}>
              {results.map((r, i) => (
                <div key={i} className={r.passed ? styles.testPass : styles.testFail}>
                  <span className={styles.testIcon}>{r.passed ? '✓' : '✗'}</span>
                  <span className={styles.testLabel}>{r.label}</span>
                  {!r.passed && (
                    <span className={styles.testDetail}>
                      — expected <code>{r.expected}</code>, got <code>{r.got}</code>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Reveal answers modal ────────────────────────────────────────────────────

const REQUIRED_PHRASE = 'I do not want to try coding this data structure myself';

const RevealAnswersModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [revealed, setRevealed] = useState(false);

  const canReveal = inputValue === REQUIRED_PHRASE;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>✕</button>

        {!revealed ? (
          <>
            <h3 className={styles.modalTitle}>Are you sure?</h3>
            <p className={styles.modalText}>
              Trying on your own is the best way to learn! If you really want to see the answers,
              type the following phrase exactly:
            </p>
            <p className={styles.modalPhrase}>&quot;{REQUIRED_PHRASE}&quot;</p>
            <input
              className={styles.modalInput}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type the phrase here..."
              autoFocus
            />
            <button
              className={styles.modalRevealBtn}
              disabled={!canReveal}
              onClick={() => canReveal && setRevealed(true)}
            >
              Reveal Answers
            </button>
          </>
        ) : (
          <>
            <h3 className={styles.modalTitle}>All Answers</h3>
            <div className={styles.answersList}>
              {operations.map((op) => (
                <div key={op.id} className={styles.answerBlock}>
                  <h4>{op.title}</h4>
                  <pre className={styles.answerCode}>{op.answer}</pre>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────

const CodeSandboxSection: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <section className={styles.card}>
      <h2 className={styles.heading}>🧑‍💻 Code the Data Structure Yourself</h2>
      <p className={styles.intro}>
        Practice implementing common array operations in JavaScript. Expand each section, write
        your solution, and run the tests to check your work.
      </p>

      <div className={styles.operationsList}>
        {operations.map((op) => (
          <OperationCard key={op.id} op={op} />
        ))}
      </div>

      <div className={styles.revealCard}>
        <p className={styles.revealText}>
          Stuck on all of them? You can reveal the answers, but try to solve them first!
        </p>
        <button className={styles.revealButton} onClick={() => setShowModal(true)}>
          🔓 Reveal All Answers
        </button>
      </div>

      {showModal && <RevealAnswersModal onClose={() => setShowModal(false)} />}
    </section>
  );
};

export default CodeSandboxSection;