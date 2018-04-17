const assert = require('assert'),
f = require('../helper')

describe('Path', () => {
	describe('#absolute()', () => {
		const absolutePath = '/Users/JaneJeon/Desktop/cat.jpg'
		
		it('should not touch absolute paths', () => {
			assert.strictEqual(f.absolute(absolutePath), absolutePath)
		})
		
		it('should return the absolute path', () => {
			assert.strictEqual(f.absolute('~/Desktop/cat.jpg'), absolutePath)
		})
	})
})