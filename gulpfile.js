var gulp = require('gulp');
var livereload = require('gulp-livereload');

var paths = {
  client: {
    watch: './client/**/*'
  }
};

gulp.task('livereload', function() {
  livereload.reload();
})

gulp.task('watch', function() {
  livereload.listen()
  gulp.watch(paths.client.watch, ['livereload']);
});

gulp.task('default', ['watch']);
