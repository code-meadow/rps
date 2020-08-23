const { src, dest, watch, series, parallel } = require('gulp');
const express = require('express');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const concat = require('gulp-concat');
const rollup = require('gulp-rollup');
const del = require('del');

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

const buildJs = () => src("./src/**/*.js")
    .pipe(rollup({
        input: './src/index.js',
        output: {
            format: 'iife'
        }
    }))
    .pipe(dest('./docs'));

const build = series(copyStatic, parallel(buildCss, buildJs));

const createLocalServerTask = () => () => {
    const app = express();

    app.use("/", express.static("./docs"));

    app.listen(PORT, "127.0.0.1", () => {
        console.log("Your local server is now running at http://127.0.0.1:" + PORT)
    });
}

const watchSrc = () => watch(["./src/*"], build);

const dev = series(
    build,
    parallel(createLocalServerTask(), watchSrc)
);

module.exports = {
    clean,
    build,
    dev
}