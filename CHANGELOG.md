# [0.4.0](https://github.com/dashevo/js-machine/compare/v0.3.0...v0.4.0) (2020-03-09)

### Bug Fixes

* use `Promise` version of `jayson` client ([ee61764](https://github.com/dashevo/js-machine/commit/ee6176417c8de106efd6e50d79ac42cecca4b693))
* prevent to update dependencies with major version `0` to minor versions ([9f1dd95](https://github.com/dashevo/js-machine/commit/9f1dd95fe2294de2d0a3157807eec9598d0f0db7))
* keep blockchain height as long value ([c6c6d22](https://github.com/dashevo/js-machine/commit/c6c6d2290901838b44ab64388ba7e1b5e9a3409e))

### Features

* isolate ST parsing and validation ([80a6011](https://github.com/dashevo/js-machine/commit/80a601104a3d6cb08126dd810f9995bfc3286acd))
* upgrade DPP to v0.11 ([60d67d7](https://github.com/dashevo/js-machine/commit/60d67d7bf113c2d0305a12b6f86fec3f695e8834))

### BREAKING CHANGES

* NodeJS < 12 is not supported anymore
* blockchain state created by previous version of Machine is not supported (cause error on start)
* see [DPP breaking changes](https://github.com/dashevo/js-dpp/blob/v0.11.0/CHANGELOG.md#0110-2020-03-09)
