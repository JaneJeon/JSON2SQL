const assert = require('assert'),
Path = require('../src/path')

describe('Path', () => {
	describe('#absolute()', () => {
		const absolutePath = '/Users/JaneJeon/Desktop/cat.jpg'
		
		it('should not touch absolute paths', () => {
			assert.strictEqual(Path.absolute(absolutePath), absolutePath)
		})
		
		it('should resolve home directory', () => {
			assert.strictEqual(Path.absolute('~/Desktop/cat.jpg'), absolutePath)
		})
		
		it('should resolve relative directory', () => {
			assert.strictEqual(Path.absolute('resources/RC_2007-03'),
				'/Users/JaneJeon/Documents/Projects/JS/ingestJSON/resources/RC_2007-03')
		})
	})
})