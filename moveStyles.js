exports.moveStyles = function () {
  if (
    typeof document === 'undefined' ||
    !document.body ||
    !document.head) {
    return;
  }
  // move all injects style tags to the <head/>
  var linkTags = document.querySelectorAll('[data-used-styles]');
  var root = document.head.firstChild;
  // remove in two steps to prevent flickering
  for (var i = 0; i < linkTags.length; ++i) {
    document.head.insertBefore(linkTags[i].cloneNode(true), root);
  }
  for (var i = 0; i < linkTags.length; ++i) {
    linkTags[i].parentNode.removeChild(linkTags[i]);
  }
};

exports.removeStyles = function () {
  if (
    typeof document === 'undefined' ||
    !document.body ||
    !document.head) {
    return;
  }
  // move all injects style tags to the <head/>
  var linkTags = document.querySelectorAll('[data-used-styles]');
  for (var i = 0; i < linkTags.length; ++i) {
    linkTags[i].parentNode.removeChild(linkTags[i]);
  }
};