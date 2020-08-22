const { src, dest } = require('gulp');

const build = () => src("./src/*")
    .pipe(dest("./dist"));

module.exports = {
    build
}