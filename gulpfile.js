var gulp = require('gulp');
var sass = require('gulp-sass');
var fs = require('fs');
var path = require('path');


// Get the list folders in dir directory
function getFolders(dir) {
    return fs.readdirSync(dir) // returns file/folder names
      .filter(function(file) { // filter those
        return fs.statSync(path.join(dir, file)).isDirectory();
    });
}

// Converts Sass to CSS with gulp-sass for all parts
gulp.task('styles', function() {
   var folders = getFolders('./'); // This directory

	return new Promise(function(resolve, reject) {
	    var tasks = folders.forEach(function(folder) {
		   	// console.log(folder);
		   	if (folder.indexOf('part') != -1 // Complile SCSS in the all parts folders
		   		&& folder != 'part-1-making-sound') {     // But not part-1 because there's no SCSS
		   		gulp.src(folder + '/synth.scss')
		    	.pipe(sass()) 
		    	.pipe(gulp.dest(folder))
		   	}
		    resolve();
		});
	});
});

// Watch SCSS and compile when and part's SCSS is changed
gulp.task('watch', function() {
	gulp.watch(['./**/**/*.scss'], gulp.series(['styles'])); // Watch this directory and two children deep
});
