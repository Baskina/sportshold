const gulp = require('gulp'),
    watch = require('gulp-watch'),
    prefixer = require('gulp-autoprefixer'),
    uglify = require('gulp-uglify'),
    sass = require('gulp-sass'),
    gulpIf = require('gulp-if'),
    runSequence = require('run-sequence'),
    sourcemaps = require('gulp-sourcemaps'),
    babel = require('gulp-babel'),
    rigger = require('gulp-rigger'),
    cssmin = require('gulp-clean-css'),
    imagemin = require('gulp-imagemin'),
    rimraf = require('rimraf'),
    browserSync = require('browser-sync'),
    rename = require('gulp-rename'),
    svgSprite = require('gulp-svg-sprites'),
    plumber = require('gulp-plumber'),
    notify = require('gulp-notify'),
    concat = require('gulp-concat-util');
reload = browserSync.reload;

gulp.task('set-dev-node-env', () => process.env.NODE_ENV = config.env = 'development');

gulp.task('set-prod-node-env', () => process.env.NODE_ENV = config.env = 'production');

const path = {
    build: {
        html: 'build/',
        php: 'build/',
        script: 'build/js/',
        style: {
            critical: 'src/includes/',
            uncritical: 'build/css/'
        },
        image: 'build/images/',
        fonts: 'build/fonts/',
        svg: {
            folder: 'src/includes/',
            file: '_svg.html'
        }
    },
    src: {
        html: 'src/*.html',
        php: 'src/**/*.php',
        script: 'src/js/*.js',
        style: {
            critical: 'src/scss/*critical.scss',
            uncritical: ['src/scss/*.scss', '!src/scss/*critical.scss']
        },
        image: ['src/images/**/**/*.*', '!src/images/svg/*.svg'],
        fonts: ['src/fonts/**/*.*', '!src/fonts/**/selection.json'],
        svg: 'src/images/svg/*.svg'
    },
    watch: {
        html: 'src/**/*.html',
        php: 'src/**/*.php',
        script: 'src/js/**/*.js',
        style: 'src/scss/**/*.scss',
        image: 'src/images/**/**/*.*',
        fonts: 'src/fonts/**/*.*',
        svg: 'src/images/svg/*.svg'
    },
    clean: './build'
};

const config = {
    server: {
        baseDir: './build'
    },
    host: 'localhost',
    port: 3000
};

gulp.task('html:build', function () {
    gulp.src(path.src.html)
        .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
        .pipe(rigger())
        .pipe(gulp.dest(path.build.html))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('php:build', function () {
    gulp.src(path.src.php)
        .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
        .pipe(gulp.dest(path.build.php))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('js:build', function () {
    gulp.src(path.src.script)
        .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
        .pipe(rigger())
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulpIf(config.env === 'development', sourcemaps.write()))
        .pipe(gulp.dest(path.build.script))
        .pipe(reload({
            stream: true
        }))
});

gulp.task('css.critical:build', function () {
    gulp.src(path.src.style.critical)
        .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(prefixer({
            browsers: ['last 7 versions'],
            cascade: false
        }))
        .pipe(cssmin())
        .pipe(concat.header('<style>'))
        .pipe(concat.footer('</style>'))
        .pipe(rename({
            prefix: '_',
            suffix: '-css',
            extname: '.html'
        }))
        .pipe(gulpIf(config.env === 'development', sourcemaps.write()))
        .pipe(gulp.dest(path.build.style.critical))
        .pipe(reload({
            stream: true
        }))
});

gulp.task('css.uncritical:build', function () {
    gulp.src(path.src.style.uncritical)
        .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(prefixer({
            browsers: ['last 7 versions'],
            cascade: false
        }))
        .pipe(cssmin())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulpIf(config.env === 'development', sourcemaps.write()))
        .pipe(gulp.dest(path.build.style.uncritical))
        .pipe(reload({
            stream: true
        }))
});

gulp.task('img:build', function () {
    return gulp.src(path.src.image)
        .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.jpegtran({progressive: true}),
            imagemin.optipng({optimizationLevel: 7}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: false},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(gulp.dest(path.build.image))
        .pipe(reload({
            stream: true
        }))
});

gulp.task('fonts:build', function () {
    gulp.src(path.src.fonts)
        .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
        .pipe(gulp.dest(path.build.fonts))
        .pipe(reload({
            stream: true
        }))
});

gulp.task('svg:build', function () {
    return gulp.src(path.src.svg)
        .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
        .pipe(imagemin([
            imagemin.svgo({
                plugins: [
                    {removeViewBox: false},
                    {removeTitle: false},
                    {cleanupIDs: true}
                ]
            })
        ]))
        .pipe(svgSprite({
            mode: "symbols",
            preview: false,
            svg: {
                symbols: path.build.svg.file
            },
            transformData(data, config) {
                data.svg.map((item) => {
                    //change id attribute
                    item.data=item.data.replace(/id=\"([^\"]+)\"/gm, `id="${item.name}-$1"`);

                    //change id in fill attribute
                    item.data=item.data.replace(/fill=\"url\(\#([^\"]+)\)\"/gm, `fill="url(#${item.name}-$1)"`);

                    //change id in mask attribute
                    item.data=item.data.replace(/mask=\"url\(\#([^\"]+)\)\"/gm, `mask="url(#${item.name}-$1)"`);

                    //change id in filter attribute
                    item.data=item.data.replace(/filter=\"url\(\#([^\"]+)\)\"/gm, `filter="url(#${item.name}-$1)"`);

                    //replace double id for the symbol tag
                    item.data=item.data.replace(`id="${item.name}-${item.name}"`, `id="${item.name}-$1"`);
                    return item;
                });
                return data; // modify the data and return it
            }
        }))
        .pipe(gulp.dest(path.build.svg.folder))
        .pipe(reload({
            stream: true
        }))
});

gulp.task('build', function (callback) {
    runSequence(
        'set-prod-node-env',
        'css.critical:build',
        'svg:build',
        ['html:build', 'php:build', 'css.uncritical:build', 'js:build', 'img:build', 'fonts:build'],
        callback)
});

gulp.task('build-dev', function (callback) {
    runSequence(
        'set-dev-node-env',
        'css.critical:build',
        'svg:build',
        ['html:build', 'php:build', 'css.uncritical:build', 'js:build', 'img:build', 'fonts:build'],
        callback)
});

gulp.task('watch', function () {
    watch([path.watch.html], function (event, cb) {
        gulp.start('html:build');
    });
    watch([path.watch.php], function (event, cb) {
        gulp.start('php:build');
    });
    watch([path.watch.style], function (event, cb) {
        gulp.start('css.critical:build');
        gulp.start('css.uncritical:build');
    });
    watch([path.watch.script], function (event, cb) {
        gulp.start('js:build');
    });
    watch([path.watch.image], function (event, cb) {
        gulp.start('img:build');
    });
    watch([path.watch.fonts], function (event, cb) {
        gulp.start('fonts:build');
    });
    watch([path.watch.svg], function (event, cb) {
        gulp.start('svg:build');
    });
});

gulp.task('webserver', function () {
    browserSync(config);
});

gulp.task('clean', function (cb) {
    rimraf(path.clean, cb)
});

gulp.task('dev', ['build-dev', 'webserver', 'watch']);

gulp.task('default', ['build','webserver', 'watch']);