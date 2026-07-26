// Encode/decode for report body content (assets/reports-data.js).
//
// Scraping resistance, not encryption: report prose is base64-encoded so it
// never sits in the served HTML/JS as plain, contiguous, greppable text.
// Anyone can still decode it (it's on the client), but a naive text scrape
// of the page source gets gibberish instead of the report body. This is the
// only file that knows the encoding scheme — swap toBase64/fromBase64 (or
// REP0RT_CODEC.decode) for something else later without touching callers.
(function (global) {
  function toBase64(str) {
    var bytes = new TextEncoder().encode(str);
    var binary = "";
    for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function fromBase64(b64) {
    var binary = atob(b64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function encode(bodyObj) {
    return toBase64(JSON.stringify(bodyObj));
  }

  function decode(encoded) {
    return JSON.parse(fromBase64(encoded));
  }

  global.REP0RT_CODEC = { encode: encode, decode: decode };
})(window);
