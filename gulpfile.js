var spawn = require('child_process').spawn,
	async = require('async'),
	del = require('del'),
	index = require('serve-index'),
	gulp = require('gulp'),
	serve = require('gulp-serve'),
	tap = require('gulp-tap'),

	port = 3333,
	reportsDir = 'reports',
	suitesGlob = 'tests/specs/**/*.test';

gulp.task('clean', function (done) {
	del([reportsDir], function (err) {
		if (err) {
			throw err;
		}
		done();
	});
});

gulp.task('test', ['clean'], function (done) {
	var files = [],
		galen = function galen(file, callback) {
			spawn('galen', [
				'test',
				file.path,
				'--htmlreport',
				reportsDir + '/' + file.relative.replace(/\.test/, '')
			], {'stdio': 'inherit'}).on('close', function (code) {
				callback(code === 0);
			});
		};

	gulp.src([suitesGlob])
		.pipe(tap(function (file) {
			files.push(file);
		}))
		.on('end', function () {
			async.rejectSeries(files, function (file, finished) {
				galen(file, finished);
			}, function (errors) {
				if (errors && errors.length > 0) {
					done("Galen reported failed tests: " + (errors.map(function (f) {
							return f.relative;
						}).join(", ")));
				}
				else {
					done();
				}
			});
		});
});

gulp.task('serve', ['test'], serve({
	'middleware': function (req, res, next) {
		index(reportsDir, {
			'filter': false,
			'hidden': true,
			'icons': true,
			'stylesheet': false,
			'template': false,
			'view': 'details'
		})(req, res, next);
	},
	'port': port,
	'root': reportsDir
}));

gulp.task('default', ['serve']);