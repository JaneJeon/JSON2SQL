const sequelize = require('sequelize')

module.exports.isValid = function(obj, schema) {
	for (const field in schema) {
		if (field.toLowerCase() !== 'id' && (!obj.hasOwnProperty(field) || obj[field] === null))
			continue
		
		const x = obj[field],
			type = typeof schema[field] === 'object'
				? schema[field]['type'] // it's a primary key
				: schema[field]
		
		switch (type) {
			case sequelize.DataTypes.BOOLEAN:
				if (typeof x !== 'boolean')
					return false
				break
			case sequelize.DataTypes.INTEGER:
				if (x !== +x || x !== (x | 0))
					return false
				break
			case sequelize.DataTypes.DOUBLE:
				if (x !== +x || x === (x | 0))
					return false
				break
			case sequelize.DataTypes.TEXT:
				// when string, just implicitly convert to string
				if (typeof x !== 'string')
					obj[field] = `${x}`
		}
	}
	
	return true
}