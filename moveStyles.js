exports.moveStyles = function () {
  if (
    typeof document === 'undefined' ||
    !document.body ||
    !document.head) {
    return;
  }
  // move all injects style tags to the <head/>
  var linkTags = document.querySelectorAll('[data-used-styles]');
  for (var i = 0; i < linkTags.length; ++i) {
    document.head.appendChild(linkTags[i]);
  }
};