const browserify = require('browserify');

/**
 * Compiles given module to standalone text representation using browserify
 * @param {string} path - relative or absolute path to file
 * @param {string} globalExportName - result of the file execution will be assigned
 *                                    to the global variable
 * @returns {Promise<string>} - compiled code
 */
async function compileFile(path, globalExportName) {
  return new Promise((resolve, reject) => {
    browserify(require.resolve(path), {
      standalone: globalExportName,
    }).bundle((err, buf) => {
      if (err) {
        return reject(err);
      }
      return resolve(buf.toString());
    });
  });
}

module.exports = compileFile;
