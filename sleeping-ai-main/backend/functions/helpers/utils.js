// Common utilities

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toPlainError(err) {
  const out = { message: "", status: null, headers: null };
  try {
    out.message = (err && err.message) ? err.message : String(err);

    if (err && typeof err.status === "number") {
      out.status = err.status;
    } else if (err && err.response && typeof err.response.status === "number") {
      out.status = err.response.status;
    }

    // Find headers 
    let headers = null;
    if (err && err.headers) headers = err.headers;
    else if (err && err.response && err.response.headers) headers = err.response.headers;

    if (headers) {
      if (typeof headers.get === "function") {
        out.headers = headers;
      } else {
        const plain = {};
        Object.keys(headers).forEach((k) => {
          plain[k.toLowerCase()] = String(headers[k]);
        });
        plain.get = function(key) {
          return plain[String(key || "").toLowerCase()];
        };
        out.headers = plain;
      }
    }
  } catch (e) {
    out.message = (err && err.message) ? err.message : String(err);
  }
  return out;
}

function clamp01(x) {
  const n = Number.isFinite(x) ? x : 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

module.exports = { sleep, toPlainError, clamp01 };
