//импортируем сам gulp чтобы можно было им пользоваться
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
// группировка медиазапросов. при их использовании ломаются исходные карты
// больше подходит для продакш сборки, чем для разработки
const groupMedia = require("gulp-group-css-media-queries");
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
// создаем автопрефиксы для цсс
const autoprefixer = require("gulp-sass-glob");
// минимизатор готового цсс
const csso = require("gulp-csso");
// минимизатор html
const htmlclean = require("gulp-htmlclean");
//генерация webp изображений
const webp = require("gulp-webp");
const webpHTML = require("gulp-webp-html");
const webpcss = require("gulp-webp-css");
// замена путей для сборки
const replace = require("gulp-replace");
const imageminWebp = require("imagemin-webp");
const typograf = require("gulp-typograf");

const extReplace = require("gulp-ext-replace");
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
gulp.task("html:docs", function () {
  // создаем поток и дальше работаем с полученными файлами. Правильное заверешение таски
  return (
    gulp
      .src(["./src/html/**/*.html", "!./src/html/blocks/*.html"])
      .pipe(changed("./docs/"))
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
      // автоподключение webp в html и добавление изображений под ретину
      .pipe(
        webpHTML({
          extensions: ["jpg", "jpeg", "png", "gif", "webp"],
          retina: {
            1: "",
            2: "@2x",
          },
        })
      )
      // минимазатор html
      .pipe(htmlclean())
      //настройки сохранения файлов
      .pipe(gulp.dest("./docs/"))
  );
});

//таска для сборки сцсс
gulp.task("sass:docs", function () {
  //берем любые файлы которые находятся по пути, с расширением сцсс
  return (
    gulp
      .src("./src/scss/*.scss")
      .pipe(changed("./docs/css/"))
      .pipe(plumber(plumberNotify("Styles")))
      // инициализация карты цсс и запоминаний что откуда берется
      .pipe(sourceMaps.init())
      .pipe(autoprefixer())
      .pipe(sassGlob())
      .pipe(webpcss())
      // в такой очереди запуска исходные карты не ломаются
      .pipe(groupMedia())
      .pipe(sass())
      .pipe(
        replace(
          /(['"]?)(\.\.\/)+(img|images|fonts|css|scss|sass|js|files|audio|video)(\/[^\/'"]+(\/))?([^'"]*)\1/gi,
          "$1$2$3$4$6$1"
        )
      )
      .pipe(csso())
      // запись цсс карты
      .pipe(sourceMaps.write())
      .pipe(gulp.dest("./docs/css/"))
  );
});

// таска для js
gulp.task("js:docs", () => {
  return gulp
    .src("./src/js/*.js")
    .pipe(changed("./docs/js"))
    .pipe(plumber(plumberNotify("JS")))
    .pipe(babel())
    .pipe(webpack(require("../webpack.config.js")))
    .pipe(gulp.dest("./docs/js"));
});

//таск для копирования изображения
gulp.task("images:docs", function () {
  return gulp
    .src("./src/img/**/*")
    .pipe(changed("./docs/img/"))
    .pipe(
      imagemin([
        imageminWebp({
          quality: 85,
        }),
      ])
    )
    .pipe(extReplace(".webp"))
    .pipe(gulp.dest("./docs/img/"))
    .pipe(gulp.src("./src/img/**/*"))
    .pipe(changed("./docs/img/"))
    .pipe(
      imagemin(
        [
          imagemin.gifsicle({ interlaced: true }),
          imagemin.mozjpeg({ quality: 85, progressive: true }),
          imagemin.optipng({ optimizationLevel: 5 }),
        ],
        { verbose: true }
      )
    )
    .pipe(gulp.dest("./docs/img/"));
});
//таск для копирования шрифтов
gulp.task("fonts:docs", function () {
  // берем все файлы из всех папок по указанному пути и сохраняем в дест
  return gulp
    .src("./src/fonts/**/*")
    .pipe(changed("./docs/fonts/"))
    .pipe(gulp.dest("./docs/fonts/"));
});
//таск для копирования файлов. Настраивается по аналогии шрифтов и картинок
gulp.task("files:docs", function () {
  // берем все файлы из всех папок по указанному пути и сохраняем в дест
  return gulp
    .src("./src/files/**/*")
    .pipe(changed("./docs/files/"))
    .pipe(gulp.dest("./docs/files/"));
});
//запуск лайв сервера
gulp.task("server:docs", function () {
  return gulp.src("./docs").pipe(server(fileStartServerSettings));
});

//удаления папки dis при повторной сборке
gulp.task("clean:docs", function (done) {
  // если папка дист есть, то запустим очистку, если нет, то запустим функцию переданную в колбек, чтобы завершить задачу
  if (fs.existsSync("./docs/"))
    return gulp.src("./docs/", { read: false }).pipe(clean({ force: true }));
  //   объект с настройками для clean говори что файлы будут находится, но не будут читаться, это ускрит процесс очистки
  //    force:true - удалять файлы в любом случае
  done();
});
