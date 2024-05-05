//импортируем сам глуп чтобы можно было им пользоваться
const gulp = require("gulp");
//Tasks
require("./gulp/dev.js");
require("./gulp/docs.js");
require("./gulp/fontsDev.js");
require("./gulp/fontsDocs.js");
//default
gulp.task(
  "default",
  //series запускает таски поочереди, а parallel запускает таски одновременно
  gulp.series(
    "clean:dev",
    "fontsDev",
    gulp.parallel("html:dev", "sass:dev", "images:dev", "files:dev", "js:dev"),
    gulp.parallel("server:dev", "watch:dev")
  )
);
//docs
gulp.task(
  "docs",
  //series запускает таски поочереди, а parallel запускает таски одновременно
  gulp.series(
    "clean:docs",
    "fontsDocs",
    gulp.parallel(
      "html:docs",
      "sass:docs",
      "images:docs",
      "files:docs",
      "js:docs"
    ),
    gulp.parallel("server:docs")
  )
);
