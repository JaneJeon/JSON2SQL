module.exports.absolute = function(file) {
	switch (file[0]) {
		case '/':
			return file
		case '~':
			return require('path').join(process.env.HOME, file.slice(1))
		default:
			return require('path').resolve(file)
	}
}