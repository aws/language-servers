import * as assert from 'assert'
import { partialClone } from './collectionUtils'

describe('partialClone', function () {
    let multipleTypedObj: object

    before(async function () {
        multipleTypedObj = {
            a: 34234234234,
            b: '123456789',
            c: new Date(2023, 1, 1),
            d: { d1: { d2: { d3: 'deep' } } },
            e: {
                e1: [4, 3, 7],
                e2: 'loooooooooo \n nnnnnnnnnnn \n gggggggg \n string',
            },
            f: () => {
                throw Error()
            },
        }
    })

    it('omits properties by depth', function () {
        assert.deepStrictEqual(partialClone(multipleTypedObj, 1), {
            ...multipleTypedObj,
            d: {},
            e: {},
        })
        assert.deepStrictEqual(partialClone(multipleTypedObj, 0, [], { replacement: '[replaced]' }), '[replaced]')
        assert.deepStrictEqual(partialClone(multipleTypedObj, 1, [], { replacement: '[replaced]' }), {
            ...multipleTypedObj,
            d: '[replaced]',
            e: '[replaced]',
        })
        assert.deepStrictEqual(partialClone(multipleTypedObj, 3), {
            ...multipleTypedObj,
            d: { d1: { d2: {} } },
        })
        assert.deepStrictEqual(partialClone(multipleTypedObj, 4), multipleTypedObj)
    })

    it('omits properties by name', function () {
        assert.deepStrictEqual(partialClone(multipleTypedObj, 2, ['c', 'e2'], { replacement: '[replaced]' }), {
            ...multipleTypedObj,
            c: '[replaced]',
            d: { d1: '[replaced]' },
            e: {
                e1: '[replaced]',
                e2: '[replaced]',
            },
        })
        assert.deepStrictEqual(partialClone(multipleTypedObj, 3, ['c', 'e2'], { replacement: '[replaced]' }), {
            ...multipleTypedObj,
            c: '[replaced]',
            d: { d1: { d2: '[replaced]' } },
            e: {
                e1: [4, 3, 7],
                e2: '[replaced]',
            },
        })
    })

    it('truncates properties by maxLength', function () {
        const testObj = {
            strValue: '1',
            boolValue: true,
            longString: '11111',
            nestedObj: {
                nestedObjAgain: {
                    longNestedStr: '11111',
                    shortNestedStr: '11',
                },
            },
            nestedObj2: {
                functionValue: (_: unknown) => {},
            },
            nestedObj3: {
                myArray: ['1', '11111', '1'],
            },
            objInArray: [{ shortString: '11', longString: '11111' }],
        }
        assert.deepStrictEqual(partialClone(testObj, 5, [], { maxStringLength: 2 }), {
            ...testObj,
            longString: '11...',
            nestedObj: {
                nestedObjAgain: {
                    longNestedStr: '11...',
                    shortNestedStr: '11',
                },
            },
            nestedObj3: {
                myArray: ['1', '11...', '1'],
            },
            objInArray: [{ shortString: '11', longString: '11...' }],
        })
    })
})
