const { src, dest, watch, series, parallel } = require('gulp');
const express = require('express');

const PORT = 7856;

const build = () => src("./src/*")
    .pipe(dest("./docs"));

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
    build,
    dev
}