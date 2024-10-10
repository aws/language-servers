import assert from 'assert'
import { DuckTyper } from './duckTyper'

const disallow: { unmatchedProperty: 'optional' | 'disallow' } = { unmatchedProperty: 'disallow' }

describe('DuckTyper', () => {
    it('false on no value provided', () => {
        const sut = new DuckTyper().requireProperty('whatever')

        assert.equal(sut.eval(null!), false)
        assert.equal(sut.eval(undefined!), false)
    })

    it('handles no rules as expected', () => {
        const sut = new DuckTyper()

        assert.equal(sut.eval({ whatever: 'whatever' }), true)
        assert.equal(sut.eval({}, disallow), true)
        assert.equal(sut.eval({ whatever: 'whatever' }, disallow), false)
    })

    it('true on containing requireProperty', () => {
        const actual = new DuckTyper().requireProperty('required').eval({ required: 'required property' })

        assert.equal(actual, true)
    })

    it('false on not containing requireProperty', () => {
        const actual = new DuckTyper().requireProperty('required').eval({ different: 'different property' })

        assert.equal(actual, false)
    })

    it('true on containing optionalProperty', () => {
        const actual = new DuckTyper().optionalProperty('optional').eval({ optional: 'optional property' })

        assert.equal(actual, true)
    })

    it('true on not containing optionalProperty', () => {
        const actual = new DuckTyper().optionalProperty('optional').eval({ different: 'different property' })

        assert.equal(actual, true)
    })

    it('false on containing disallowProperty', () => {
        const actual = new DuckTyper().disallowProperty('disallowed').eval({ disallowed: 'disallowed property' })

        assert.equal(actual, false)
    })

    it('true on not containing disallowProperty', () => {
        const actual = new DuckTyper().disallowProperty('disallowed').eval({ different: 'different property' })

        assert.equal(actual, true)
    })

    it('false on extra properties with onlyDefined', () => {
        const actual = new DuckTyper().requireProperty('shouldExist').eval(
            {
                shouldExist: 42,
                shouldNotExist: 'KABOOM!',
            },
            disallow
        )

        assert.equal(actual, false)
    })

    it('works on multiple rules and complex objects', () => {
        const actual = new DuckTyper()
            .requireProperty('required')
            .requireProperty('required2')
            .optionalProperty('optional')
            .disallowProperty('disallowed')
            .eval({
                required: 1,
                required2: 'one more',
                optional: 2,
                different: () => 'functions are fun',
                complicated: {
                    disallowed: 'this should not matter',
                },
            })

        assert.equal(actual, true)
    })
})
