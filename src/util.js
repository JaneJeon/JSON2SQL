module.exports.read = function(file) {
	return require('readline').createInterface({
		input: require('fs').createReadStream(file)
	})
}

// colours for console.log
const RED = '\x1b[31m',
	YELLOW = '\x1b[33m',
	GREEN = '\x1b[32m',
	RESET = '\x1b[0m'

module.exports.printErr = function(str) {
	console.error(RED, str, RESET)
}

module.exports.printNotice = function(str) {
	console.log(YELLOW, str, RESET)
}

module.exports.printOk = function(str) {
	console.log(GREEN, str, RESET)
}