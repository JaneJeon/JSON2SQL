// quoted and escaped by ", delimited by commas
module.exports.convert = function(obj, schema, mysql = false) {
	const NULL = mysql ? '\\N' : 'NULL'
	
	return Object.keys(schema)
		.map(field => obj === schema ? field : obj[field])
		.map(data => data === null || data === undefined
			? NULL
			: typeof data === 'string'
				// need to escape quoting characters
				// also need to escape newlines (windows & mac versions)
				? `"${data.replace(/"/g,'""').replace(/\r?\n|\r/g, '\\n')}"`
				: data)
		.join(',') + '\n'
}