// CodeMirrorEditor.tsx
import { useEffect, useRef } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState, type Extension } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { autocompletion, type CompletionSource } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, HighlightStyle, bracketMatching, foldGutter } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { lintGutter, setDiagnostics, type Diagnostic } from '@codemirror/lint';
import { tags } from '@lezer/highlight';

// ─── Explicit syntax theme — light-on-dark tokens ────────────────────────────

const vibeTeachTheme = EditorView.theme({
  // Editor chrome
  '&': {
    backgroundColor: '#0d1117',
    color: '#f0f4f8',
  },
  '.cm-content': {
    caretColor: '#f0f4f8',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#f0f4f8',
  },
  // Selection
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-line::selection, .cm-selectionLayer':
    { backgroundColor: '#264f78' },
  '.cm-activeLine': {
    backgroundColor: '#161b22',
  },
  // Gutters (line numbers, fold gutter, lint markers)
  '.cm-gutters': {
    backgroundColor: '#0d1117',
    color: '#6e7681',
    border: 'none',
    borderRight: '1px solid #21262d',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#161b22',
    color: '#c9d1d9',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 8px 0 6px',
  },
  // Fold gutter
  '.cm-foldGutter .cm-gutterElement': {
    color: '#6e7681',
  },
  // Bracket matching
  '.cm-matchingBracket, .cm-nonmatchingBracket': {
    backgroundColor: '#264f78',
    outline: '1px solid #58a6ff',
  },
  // Active line highlight
  '.cm-activeLine': {
    backgroundColor: '#161b2280',
  },
  // Indent guides
  '.cm-indentGuide': {
    borderLeft: '1px solid #21262d',
  },
  // Tooltip (autocomplete)
  '.cm-tooltip': {
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
    color: '#f0f4f8',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li': {
      padding: '2px 8px',
    },
    '& > ul > li[aria-selected]': {
      backgroundColor: '#264f78',
      color: '#f0f4f8',
    },
  },
  // Lint tooltip
  '.cm-tooltip-lint': {
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
    color: '#f0f4f8',
    borderRadius: '6px',
    fontSize: '13px',
  },
  // Lint markers
  '.cm-lint-marker': {
    width: '16px',
    height: '16px',
  },
  '.cm-lint-marker-error': {
    background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='7' fill='%23f85149'/%3E%3Ctext x='8' y='12' text-anchor='middle' fill='white' font-size='11' font-weight='bold'%3E!%3C/text%3E%3C/svg%3E") center/contain no-repeat`,
  },
  '.cm-lint-marker-warning': {
    background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='7' fill='%23d29922'/%3E%3Ctext x='8' y='12' text-anchor='middle' fill='white' font-size='11' font-weight='bold'%3E!%3C/text%3E%3C/svg%3E") center/contain no-repeat`,
  },
  '.cm-lintRange-error': {
    backgroundImage: 'none',
    borderBottom: '2px wavy #f85149',
  },
  '.cm-lintRange-warning': {
    backgroundImage: 'none',
    borderBottom: '2px wavy #d29922',
  },
  // Scrollbar styling
  '&::-webkit-scrollbar, .cm-scroller::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#30363d',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#0d1117',
  },
}, { dark: true });

/**
 * Explicit syntax highlighting — every token type mapped to a bright color
 * that reads clearly on the dark editor background.
 */
const vibeTeachHighlight = HighlightStyle.define([
  // Default / plain text
  { tag: tags.variableName, color: '#e6edf3' },
  { tag: tags.local(tags.variableName), color: '#e6edf3' },
  { tag: tags.definition(tags.variableName), color: '#e6edf3' },
  { tag: tags.definition(tags.propertyName), color: '#e6edf3' },

  // Keywords: const, let, var, function, return, if, else, for, while, class, new, this...
  { tag: tags.keyword, color: '#ff7b72' },
  { tag: tags.controlKeyword, color: '#ff7b72' },
  { tag: tags.operatorKeyword, color: '#ff7b72' },
  { tag: tags.definitionKeyword, color: '#ff7b72' },
  { tag: tags.moduleKeyword, color: '#ff7b72' },

  // Operators: + - * / = === !== && || ! < > etc.
  { tag: tags.operator, color: '#c9d1d9' },
  { tag: tags.updateOperator, color: '#c9d1d9' },
  { tag: tags.arithmeticOperator, color: '#c9d1d9' },
  { tag: tags.logicOperator, color: '#c9d1d9' },
  { tag: tags.compareOperator, color: '#c9d1d9' },
  { tag: tags.punctuation, color: '#c9d1d9' },
  { tag: tags.separator, color: '#c9d1d9' },
  { tag: tags.paren, color: '#c9d1d9' },
  { tag: tags.squareBracket, color: '#c9d1d9' },
  { tag: tags.brace, color: '#c9d1d9' },
  { tag: tags.derefOperator, color: '#c9d1d9' },

  // Strings
  { tag: tags.string, color: '#a5d6ff' },
  { tag: tags.special(tags.string), color: '#a5d6ff' },
  { tag: tags.character, color: '#a5d6ff' },
  { tag: tags.regexp, color: '#a5d6ff' },

  // Numbers and booleans
  { tag: tags.number, color: '#79c0ff' },
  { tag: tags.integer, color: '#79c0ff' },
  { tag: tags.float, color: '#79c0ff' },
  { tag: tags.bool, color: '#79c0ff' },

  // null, undefined
  { tag: tags.null, color: '#79c0ff' },

  // Comments
  { tag: tags.comment, color: '#8b949e', fontStyle: 'italic' },
  { tag: tags.lineComment, color: '#8b949e', fontStyle: 'italic' },
  { tag: tags.blockComment, color: '#8b949e', fontStyle: 'italic' },
  { tag: tags.docComment, color: '#8b949e', fontStyle: 'italic' },

  // Functions / methods: function foo(), arr.push()
  { tag: tags.function(tags.variableName), color: '#d2a8ff' },
  { tag: tags.function(tags.definition(tags.variableName)), color: '#d2a8ff' },
  { tag: tags.function(tags.propertyName), color: '#d2a8ff' },

  // Properties / member access: arr.length, this.x
  { tag: tags.propertyName, color: '#e6edf3' },

  // Types (class names etc.)
  { tag: tags.className, color: '#ffa657' },
  { tag: tags.typeName, color: '#ffa657' },

  // Constants
  { tag: tags.constant(tags.variableName), color: '#79c0ff' },

  // Decorators / annotations
  { tag: tags.meta, color: '#8b949e' },

  // Angle brackets (JSX etc.)
  { tag: tags.angleBracket, color: '#c9d1d9' },
  { tag: tags.tagName, color: '#7ee787' },
  { tag: tags.attributeName, color: '#79c0ff' },
  { tag: tags.attributeValue, color: '#a5d6ff' },

  // Heading / strong / emphasis (not typically relevant for JS but included for completeness)
  { tag: tags.heading, color: '#e6edf3', fontWeight: 'bold' },
  { tag: tags.strong, color: '#e6edf3', fontWeight: 'bold' },
  { tag: tags.emphasis, color: '#e6edf3', fontStyle: 'italic' },
]);

interface CodeMirrorEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  diagnostics?: Diagnostic[];
}

const jsKeywords: CompletionSource = (context) => {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  const options = [
    // JS keywords
    { label: 'const', type: 'keyword' },
    { label: 'let', type: 'keyword' },
    { label: 'var', type: 'keyword' },
    { label: 'function', type: 'keyword' },
    { label: 'return', type: 'keyword' },
    { label: 'if', type: 'keyword' },
    { label: 'else', type: 'keyword' },
    { label: 'for', type: 'keyword' },
    { label: 'while', type: 'keyword' },
    { label: 'class', type: 'keyword' },
    { label: 'new', type: 'keyword' },
    { label: 'this', type: 'keyword' },
    { label: 'true', type: 'keyword' },
    { label: 'false', type: 'keyword' },
    { label: 'null', type: 'keyword' },
    { label: 'undefined', type: 'keyword' },
    // Built-in objects
    { label: 'console', type: 'variable' },
    { label: 'Math', type: 'variable' },
    { label: 'Array', type: 'variable' },
    // Array methods
    { label: 'push', type: 'method' },
    { label: 'pop', type: 'method' },
    { label: 'shift', type: 'method' },
    { label: 'unshift', type: 'method' },
    { label: 'splice', type: 'method' },
    { label: 'slice', type: 'method' },
    { label: 'indexOf', type: 'method' },
    { label: 'includes', type: 'method' },
    { label: 'length', type: 'property' },
    { label: 'map', type: 'method' },
    { label: 'filter', type: 'method' },
    { label: 'reduce', type: 'method' },
    { label: 'forEach', type: 'method' },
  ];

  return {
    from: word.from,
    options: options.filter((o) => o.label.startsWith(word.text)),
  };
};

const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({ value, onChange, readOnly = false, height = '200px', diagnostics }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;

    const extensions: Extension[] = [
      vibeTeachTheme,
      syntaxHighlighting(vibeTeachHighlight),
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      foldGutter(),
      bracketMatching(),
      closeBrackets(),
      javascript(),
      autocompletion({ override: [jsKeywords] }),
      lintGutter(),
      keymap.of([...defaultKeymap, ...historyKeymap, ...closeBracketsKeymap]),
      EditorView.theme({
        '&': {
          height: height,
          fontSize: '14px',
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace',
        },
        '.cm-content': {
          padding: '8px 0',
          color: '#f0f4f8',
        },
      }),
    ];

    if (readOnly) {
      extensions.push(EditorState.readOnly.of(true));
      extensions.push(EditorView.editable.of(false));
    } else {
      extensions.push(
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current?.(update.state.doc.toString());
          }
        })
      );
    }

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, height]);

  // Update diagnostics when they change
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !diagnostics) return;
    // Dispatch setDiagnostics to update the lint gutter markers and overlays
    view.dispatch(setDiagnostics(view.state, diagnostics));
  }, [diagnostics]);

  return <div ref={containerRef} className="cm-editor-wrapper" />;
};

export default CodeMirrorEditor;