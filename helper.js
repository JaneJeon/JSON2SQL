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

// Postgres FORCES any column named 'id' to be a primary key,
// and to do that, you need to specifically mark it as being one for Sequelize.
// And of course, since we're treating 'id' column differently,
// we must treat it differently in *every other function* as well...
function setKey(schema, key, type) {
	schema[key] = key.toLowerCase() === 'id'
		? { type: type,
			primaryKey: true }
		: type
}

module.exports.isValid = function(obj, schema) {
	for (const field in schema) {
		const x = obj[field],
		type = typeof schema[field] === 'object'
			? schema[field]['type'] // it's a primary key
			: schema[field]
		
		switch (type) {
			case Sequelize.DataTypes.BOOLEAN:
				if (typeof x !== 'boolean')
					return false
				break
			case Sequelize.DataTypes.INTEGER:
				if (x !== +x || x !== (x | 0))
					return false
				break
			case Sequelize.DataTypes.DOUBLE:
				if (x !== +x || x === (x | 0))
					return false
				break
			case Sequelize.DataTypes.TEXT:
				// when string, just implicitly convert to string
				if (typeof x !== 'string')
					obj[field] = `${x}`
		}
	}
	
	return true
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