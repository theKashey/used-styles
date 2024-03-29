/**
 * moves dynamically injected styles outside of rendered content to the document head to avoid hydration mismatch
 * @see {@link removeStyles} as a followup when all required styles are loaded as files
 */
export const moveStyles = () => {
  if (typeof document === 'undefined' || !document.body || !document.head) {
    return;
  }

  // move all injects style tags to the <head/>
  const linkTags = document.querySelectorAll('[data-used-styles]');
  const root = document.head.firstChild;

  // remove in two steps to prevent flickering
  for (let i = 0; i < linkTags.length; ++i) {
    document.head.insertBefore(linkTags[i].cloneNode(true), root);
  }

  for (let i = 0; i < linkTags.length; ++i) {
    linkTags[i].parentNode?.removeChild(linkTags[i]);
  }
};

/**
 * removes dynamically injected styles to avoid hydration mismatch
 * @see {@link moveStyles} to only move styles and avoid "flash of unstyled content"
 */

export const removeStyles = () => {
  if (typeof document === 'undefined' || !document.body || !document.head) {
    return;
  }

  // move all injects style tags to the <head/>
  const linkTags = document.querySelectorAll('[data-used-styles]');

  for (let i = 0; i < linkTags.length; ++i) {
    linkTags[i].parentNode?.removeChild(linkTags[i]);
  }
};
