const { src, dest } = require('gulp');

const build = () => src("./src/*")
    .pipe(dest("./docs"));

module.exports = {
    build
}