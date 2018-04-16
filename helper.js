const fs = require('fs'),
path = require('path'),
readline = require('readline'),
Sequelize = require('sequelize')

module.exports.absolute = function(file) {
	return file[0] === '~' 
		? path.join(process.env.HOME, file.slice(1)) 
		: file
}

module.exports.read = function(file) {
	return readline.createInterface({
		input: fs.createReadStream(file)
	})
}

function setKey(schema, key, type) {
	schema[key] = key.toLowerCase() === 'id'
		? {
			type: type,
			primaryKey: true
		} : type
}

module.exports.generateSchema = function(obj, schema) {
	Object.keys(obj)
		.filter(key => !schema.hasOwnProperty(key))
		.forEach(key => {
			switch (typeof obj[key]) {
				case 'boolean':
					setKey(schema, key, Sequelize.DataTypes.BOOLEAN)
					break
				case 'number':
					setKey(schema, key, Number.isInteger(obj[key])
						? Sequelize.DataTypes.INTEGER
						: Sequelize.DataTypes.DOUBLE)
					break
				case 'string':
					setKey(schema, key, Sequelize.DataTypes.TEXT)
			}
		})
}

// quoted and escaped by ", delimited by commas
module.exports.generateCSV = function(obj, schema, mysql = false) {
	const NULL = mysql ? '\\N' : 'NULL'
	
	return Object.keys(schema)
		.map(field => obj === schema ? field : obj[field])
		.map(data => data === null 
			? NULL 
			: typeof data === 'string'
				// need to escape quoting characters
				// also need to escape newlines (windows & mac versions)
				? `"${data.replace(/"/g,'""').replace(/\r?\n|\r/g, '\\n')}"` 
				: data)
		.join(',') + '\n'
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