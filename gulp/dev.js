const gulp = require("gulp");
const fileInclude = require("gulp-file-include");
const sass = require("gulp-sass")(require("sass"));
const server = require("gulp-server-livereload");
const clean = require("gulp-clean");
const fs = require("fs");
const sourceMaps = require("gulp-sourcemaps");
const plumber = require("gulp-plumber");
const notify = require("gulp-notify");
const webpack = require("webpack-stream");
const changed = require("gulp-changed");
const sassGlob = require("gulp-sass-glob");
const replace = require("gulp-replace");
const typograf = require("gulp-typograf");

function plumberNotify(title) {
  return {
    errorrHandler: notify.onError({
      title: title,
      message: "Error <%= error.message %>",
      sound: false,
    }),
  };
}

const fileIncludeSettings = {
  prefix: "@@",
  basepath: "@file",
};

const fileStartServerSettings = {
  livereload: true,
  open: true,
};

gulp.task("html:dev", function () {
  return gulp
    .src(["./src/html/**/*.html", "!./src/html/blocks/*.html"])
    .pipe(changed("./build/", { hasChanged: changed.compareContents }))
    .pipe(plumber(plumberNotify("Html")))
    .pipe(fileInclude(fileIncludeSettings))
    .pipe(
      replace(
        /(?<=src=|href=|srcset=)(['"])(\.(\.)?\/)*(img|images|fonts|css|scss|sass|js|files|audio|video)(\/[^\/'"]+(\/))?([^'"]*)\1/gi,
        "$1./$4$5$7$1"
      )
    )
    .pipe(
      typograf({
        locale: ["ru", "en-US"],
        htmlEntity: { type: "digit" },
        safeTags: [
          ["<\\?php", "\\?>"],
          ["<no-typography>", "</no-typography>"],
        ],
      })
    )
    .pipe(gulp.dest("./build/"));
});

gulp.task("sass:dev", function () {
  return gulp
    .src("./src/scss/*.scss")
    .pipe(changed("./build/css/"))
    .pipe(plumber(plumberNotify("Styles")))
    .pipe(sourceMaps.init())
    .pipe(sassGlob())
    .pipe(sass())
    .pipe(
      replace(
        /(['"]?)(\.\.\/)+(img|images|fonts|css|scss|sass|js|files|audio|video)(\/[^\/'"]+(\/))?([^'"]*)\1/gi,
        "$1$2$3$4$6$1"
      )
    )
    .pipe(sourceMaps.write())
    .pipe(gulp.dest("./build/css/"));
});

gulp.task("js:dev", () => {
  return gulp
    .src("./src/js/*.js")
    .pipe(changed("./build/js"))
    .pipe(plumber(plumberNotify("JS")))
    .pipe(webpack(require("./../webpack.config.js")))
    .pipe(gulp.dest("./build/js"));
});

gulp.task("images:dev", function () {
  return gulp
    .src("./src/img/**/*")
    .pipe(changed("./build/img/"))
    .pipe(gulp.dest("./build/img/"));
});

gulp.task("files:dev", function () {
  return gulp
    .src("./src/files/**/*")
    .pipe(changed("./build/files/"))
    .pipe(gulp.dest("./build/files/"));
});

gulp.task("server:dev", function () {
  return gulp.src("./build").pipe(server(fileStartServerSettings));
});

gulp.task("clean:dev", function (done) {
  if (fs.existsSync("./build/"))
    return gulp.src("./build/", { read: false }).pipe(clean({ force: true }));
  done();
});

gulp.task("watch:dev", function () {
  gulp.watch("./src/scss/**/*.scss", gulp.parallel("sass:dev"));
  gulp.watch("./src/**/*.html", gulp.parallel("html:dev"));
  gulp.watch("./src/img/**/*", gulp.parallel("images:dev"));
  gulp.watch("./src/files/**/*", gulp.parallel("files:dev"));
  gulp.watch("./src/js/**/*.js", gulp.parallel("js:dev"));
});
