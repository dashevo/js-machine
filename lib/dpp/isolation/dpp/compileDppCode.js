const browserify = require('browserify');
const through = require('through2');

async function compileJsonSchemaValidatorCode() {
  return new Promise((resolve, reject) => {
    browserify(
      require.resolve('./internal/dpp'),
      {
        standalone: 'DPP',
        insertGlobalVars: {
          setImmediate() {
            return {
              id: 'setimmediate',
            };
          },
        },
      },
    ).transform(() => (
      through(function transformUriJS(buf, enc, next) {
        this.push(buf.toString('utf8')
          .replace(
            /require\('uri-js'\)/g,
            `require('${require.resolve('../validator/internal/UriJSShim')}')`,
          ));
        next();
      })
    ), {
      global: true,
    }).bundle((err, buf) => {
      if (err) {
        return reject(err);
      }
      return resolve(buf.toString());
    });
  });
}

module.exports = compileJsonSchemaValidatorCode;
