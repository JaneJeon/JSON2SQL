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
					schema[key] = Sequelize.DataTypes.BOOLEAN
					break
				case 'number':
					schema[key] = Number.isInteger(obj[key])
						? Sequelize.DataTypes.INTEGER
						: Sequelize.DataTypes.DOUBLE
					break
				case 'string':
					schema[key] = Sequelize.DataTypes.TEXT
			}
		})
}

// quoted by "", escaped by `\`, separated by `,`
module.exports.generateCSV = function(obj, schema, mysql = false) {
	const NULL = mysql ? '\\N' : 'NULL'
	
	return Object.keys(schema)
		.map(field => obj[field])
		.map(data => data === null ? NULL 
			: typeof data === 'string' || data instanceof String
				? `"${data.replace(/"/g,'\\"')}"` : data)
		.join(',') + '\n'
}