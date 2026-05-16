// components/CodeSandboxSection.tsx
import { useState } from "react";
import styles from "./CodeExample.module.scss";

const defaultCode = "";

const CodeSandboxSection = () => {

  // --- Code Sandbox State ---
  const [code, setCode] = useState<string>(defaultCode);
  const [sandboxOutput, setSandboxOutput] = useState<string>('');

  // --- Sandbox Handlers ---
  const runSandboxCode = () => {
    setSandboxOutput('Running...');
    setTimeout(() => {
      try {
        // eslint-disable-next-line no-new-func
        const sandboxFunction = new Function(code);
        const result = sandboxFunction();
        setSandboxOutput(`✅ Output:\n${JSON.stringify(result, null, 2)}`);
      } catch (err: any) {
        setSandboxOutput(`❌ Error:\n${err.message}`);
      }
    }, 50);
  };

  return (
    <section className={`${styles.card} ${styles.sandboxCard}`}>
      <h2 className={styles.heading}>Code the Data Structure Yourself (JavaScript)</h2>

      <textarea
        className={styles.codeEditor}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={14}
        spellCheck={false}
      />

      <div className={styles.sandboxButtons}>
        <button className={styles.runButton} onClick={runSandboxCode}>
          ▶ Run Code
        </button>
      </div>

      <pre className={styles.sandboxOutput}>{sandboxOutput || "// Output will appear here"}</pre>
    </section>
  );
};

export { defaultCode };
export default CodeSandboxSection;
