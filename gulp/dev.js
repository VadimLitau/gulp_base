//импортируем сам глуп чтобы можно было им пользоваться
const gulp = require("gulp");
const fileInclude = require("gulp-file-include");
//сначала подключаем гулп сасс, сразу запускаем и в нем подключаем сам сасс
const sass = require("gulp-sass")(require("sass"));
const server = require("gulp-server-livereload");
const clean = require("gulp-clean");
// модуль для работы с файловой системой, берется из ноды
const fs = require("fs");
//плагин для цсс карт
//исходжные карты - показывает в девтулс в каком из файлов находится стиль
const sourceMaps = require("gulp-sourcemaps");
//plumb не дает сборке зависнуть во время ошибок, а notify выводит сообщения об ошибке на экран
const plumber = require("gulp-plumber");
const notify = require("gulp-notify");
// для сборки js и работы с этими файлами используется функционал вебпака
const webpack = require("webpack-stream");
//транспилятор современного js кода для старых браузеров
const babel = require("gulp-babel");
// минимизатор изображений
const imagemin = require("gulp-imagemin");
// возможность для gulp не работать с фалйами в которых не было изменений
const changed = require("gulp-changed");
// подключение несколькоих файлов стилей в один документ, возможность импортить файлы через * в путях
const sassGlob = require("gulp-sass-glob");
// замена путей для сборки
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
  //настройки поиска встраиваемых участков html кода из других файлов
  prefix: "@@",
  basepath: "@file",
};

const fileStartServerSettings = {
  //горячая перезагрузка
  livereload: true,
  // открывать страницу в браузере при старте сервера
  open: true,
};
//таска для сборки штмл из разных файлов
gulp.task("html:dev", function () {
  // создаем поток и дальше работаем с полученными файлами. Правильное заверешение таски
  return (
    gulp
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
      //настройки сохранения файлов
      .pipe(gulp.dest("./build/"))
  );
});

//таска для сборки сцсс
gulp.task("sass:dev", function () {
  //берем любые файлы которые находятся по пути, с расширением сцсс
  return (
    gulp
      .src("./src/scss/*.scss")
      .pipe(changed("./build/css/"))
      .pipe(plumber(plumberNotify("Styles")))
      // инициализация карты цсс и запоминаний что откуда берется
      .pipe(sourceMaps.init())
      .pipe(sassGlob())
      .pipe(sass())
      .pipe(
        replace(
          /(['"]?)(\.\.\/)+(img|images|fonts|css|scss|sass|js|files|audio|video)(\/[^\/'"]+(\/))?([^'"]*)\1/gi,
          "$1$2$3$4$6$1"
        )
      )
      // запись цсс карты
      .pipe(sourceMaps.write())
      .pipe(gulp.dest("./build/css/"))
  );
});

// таска для js
gulp.task("js:dev", () => {
  return (
    gulp
      .src("./src/js/*.js")
      .pipe(changed("./build/js"))
      .pipe(plumber(plumberNotify("JS")))
      // .pipe(babel())
      .pipe(webpack(require("./../webpack.config.js")))
      .pipe(gulp.dest("./build/js"))
  );
});

//таск для копирования изображения
gulp.task("images:dev", function () {
  // берем все файлы из всех папок по указанному пути и сохраняем в дест
  return (
    gulp
      .src("./src/img/**/*")
      .pipe(changed("./build/img/"))
      //подключаем минимизатор. Настройка в объекте показывает сколько места было сохранено
      // .pipe(imagemin({ verbose: true }))
      .pipe(gulp.dest("./build/img/"))
  );
});
//таск для копирования шрифтов
gulp.task("fonts:dev", function () {
  // берем все файлы из всех папок по указанному пути и сохраняем в дест
  return gulp
    .src("./src/fonts/**/*")
    .pipe(changed("./build/fonts/"))
    .pipe(gulp.dest("./build/fonts/"));
});
//таск для копирования файлов. Настраивается по аналогии шрифтов и картинок
gulp.task("files:dev", function () {
  // берем все файлы из всех папок по указанному пути и сохраняем в дест
  return gulp
    .src("./src/files/**/*")
    .pipe(changed("./build/files/"))
    .pipe(gulp.dest("./build/files/"));
});
//запуск лайв сервера
gulp.task("server:dev", function () {
  return gulp.src("./build").pipe(server(fileStartServerSettings));
});

//удаления папки dis при повторной сборке
gulp.task("clean:dev", function (done) {
  // если папка дист есть, то запустим очистку, если нет, то запустим функцию переданную в колбек, чтобы завершить задачу
  if (fs.existsSync("./build/"))
    return gulp.src("./build/", { read: false }).pipe(clean({ force: true }));
  //   объект с настройками для clean говори что файлы будут находится, но не будут читаться, это ускрит процесс очистки
  //    force:true - удалять файлы в любом случае
  done();
});

//отслеживание изменений в файлах
gulp.task("watch:dev", function () {
  gulp.watch("./src/scss/**/*.scss", gulp.parallel("sass:dev"));
  gulp.watch("./src/**/*.html", gulp.parallel("html:dev"));
  gulp.watch("./src/img/**/*", gulp.parallel("images:dev"));
  gulp.watch("./src/fonts/**/*", gulp.parallel("fonts:dev"));
  gulp.watch("./src/files/**/*", gulp.parallel("files:dev"));
  gulp.watch("./src/js/**/*.js", gulp.parallel("js:dev"));
});

// дефолтный таск, будет запущен при команде gulp

//создадим задачу для гулп. Первый аргумент название таски, второй действие при вызове таски
// для прваильного завершения задачи гулп должен возвращать поток или колбек. Т.е ретурн или done как аргумент функции и вызвать его в конец
// gulp.task("hello", function (done) {
//   console.log("hello");
//   done();
// });
//дефолтный таск будет вызван просто при вводе в терминал gulp. метод series поочередно будет вызывать таски по имени
// gulp.task("default", gulp.series("hello"));
