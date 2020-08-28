const { src, dest, watch, series, parallel } = require('gulp');
const express = require('express');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const concat = require('gulp-concat');
const del = require('del');
const open = require('open');
const { rollup } = require('rollup');
const commonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const { terser } = require('rollup-plugin-terser');

const PORT = 7856;

const clean = () => del(["./docs/**/*"]);

const copyStatic = () => src("./static/*")
    .pipe(dest("./docs"));

const buildCss = () => src("./assets/**/*.scss")
    .pipe(sass().on('error', sass.logError))
    .pipe(concat('style.css'))
    .pipe(postcss([
        autoprefixer(),
        cssnano()
    ]))
    .pipe(dest('./docs'));

const buildJs = () => {
    return rollup({
        input: './src/index.js',
        output: {
            format: 'iife'
        },
        plugins: [
            nodeResolve(),
            commonjs(),
            terser()
        ]
    }).then(bundle => {
        return bundle.write({
            file: './docs/index.js',
            format: 'iife',
            name: 'index',
            sourcemap: false
        });
    })
}

const build = series(copyStatic, parallel(buildCss, buildJs));

const createLocalServerTask = () => (done) => {
    const app = express();

    app.use("/", express.static("./docs"));

    app.listen(PORT, "127.0.0.1", () => {
        console.log("Your local server is now running at http://127.0.0.1:" + PORT)
        done();
    });
}

const watchSrc = () => watch(["./src/*", "./assets/*"], build);

const dev = series(
    build,
    parallel(
        series(
            createLocalServerTask(),
            () => open("http://localhost:" + PORT)
        ),
        watchSrc)
);

module.exports = {
    clean,
    build,
    dev
}