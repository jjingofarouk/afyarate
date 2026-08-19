/**
 * Blocks copy and cut only, selection and the native context menu are
 * left intact so mobile users can long-press and see the "Copy" button,
 * which then fires the copy event we intercept and explain with a toast.
 */
export function NoCopyScript() {
  const code = `
    (function () {
      function block(e) {
        if (window.__allowCopy) return;
        e.preventDefault();
        return false;
      }
      document.addEventListener("copy", block);
      document.addEventListener("cut", block);
      document.addEventListener("selectstart", block);
      document.addEventListener("dragstart", block);
    })();
  `;
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export default NoCopyScript;
