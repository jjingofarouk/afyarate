/**
 * Server component that injects an inline script to prevent text copying
 * from the site entirely. Runs at HTML parse time (before hydration),
 * so it does not depend on client chunk loading.
 *
 * Blocks copy, cut, right-click context menu, text selection and dragging.
 */
export function NoCopyScript() {
  const code = `
    (function () {
      function block(e) {
        if (window.__allowCopy) return; // allow our share-button programmatic copies
        e.preventDefault();
        return false;
      }
      document.addEventListener("copy", block);
      document.addEventListener("cut", block);
      document.addEventListener("contextmenu", block);
      document.addEventListener("selectstart", block);
      document.addEventListener("dragstart", block);
    })();
  `;
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export default NoCopyScript;
