const sequelize = require('sequelize')

module.exports.update = function(obj, schema) {
	Object.keys(obj)
		.filter(key => !schema.hasOwnProperty(key))
		.forEach(key => {
			switch (typeof obj[key]) {
				case 'boolean':
					setKey(schema, key, sequelize.DataTypes.BOOLEAN)
					break
				case 'number':
					setKey(schema, key, Number.isInteger(obj[key])
						? sequelize.DataTypes.INTEGER
						: sequelize.DataTypes.DOUBLE)
					break
				case 'string':
					setKey(schema, key, sequelize.DataTypes.TEXT)
			}
		})
}

// Postgres FORCES any column named 'id' to be a primary key,
// and to do that, you need to specifically mark it as being one for sequelize.
// And of course, since we're treating 'id' column differently,
// we must treat it differently in *every other function* as well...
function setKey(schema, key, type) {
	schema[key] = key.toLowerCase() === 'id'
		? { type: type,
			primaryKey: true }
		: type
}