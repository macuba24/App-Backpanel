const fs = require("node:fs");

// Node on this Windows install reports EISDIR from readlink for ordinary files.
// Next.js only ignores EINVAL, so the production build aborts. Map EISDIR to EINVAL.
function asNotALink(error) {
  if (error && error.code === "EISDIR") {
    const invalid = new Error("EINVAL");
    invalid.code = "EINVAL";
    invalid.syscall = "readlink";
    return invalid;
  }
  return error;
}

const readlinkSync = fs.readlinkSync;
fs.readlinkSync = function readlinkSyncPatched(target, options) {
  try {
    return options === undefined ? readlinkSync(target) : readlinkSync(target, options);
  } catch (error) {
    throw asNotALink(error);
  }
};

const readlink = fs.readlink;
fs.readlink = function readlinkPatched(target, options, callback) {
  if (typeof options === "function") {
    return readlink(target, (error, link) => {
      options(asNotALink(error), link);
    });
  }
  return readlink(target, options, (error, link) => {
    callback(asNotALink(error), link);
  });
};

const readlinkAsync = fs.promises.readlink.bind(fs.promises);
fs.promises.readlink = async function readlinkAsyncPatched(target, options) {
  try {
    return options === undefined ? await readlinkAsync(target) : await readlinkAsync(target, options);
  } catch (error) {
    throw asNotALink(error);
  }
};
