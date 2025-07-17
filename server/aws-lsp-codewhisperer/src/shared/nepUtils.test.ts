import * as assert from 'assert'
import { isEditsInvolveEmptyLinesOnly } from './nepUtils'

describe('nepUtils', function () {
    describe('isEditsInvolveEmptyLinesOnly', function () {
        const shouldReturnTrue: { expected: boolean; case: string }[] = [
            {
                expected: true,
                case: `--- file1.txt
+++ file1.txt
@@ -1,3 +1,4 @@
 const hello = "world";
+
 console.log(hello);
 // end of file`,
            },
            {
                expected: true,
                case: `--- file1.txt
+++ file1.txt
@@ -1,4 +1,3 @@
 const hello = "world";
-
 console.log(hello);
 // end of file`,
            },
            {
                expected: true,
                case: `--- file1.txt
+++ file1.txt
@@ -1,5 +1,5 @@
 const hello = "world";
-
+
 console.log(hello);
-
+
 // end of file`,
            },
        ]

        for (let i = 0; i < shouldReturnTrue.length; i++) {
            it(shouldReturnTrue[i].case, function () {
                const actual = isEditsInvolveEmptyLinesOnly(shouldReturnTrue[i].case)
                assert.strictEqual(actual, shouldReturnTrue[i].expected)
            })
        }

        const shouldReturnFalse: { expected: boolean; case: string }[] = [
            {
                expected: false,
                case: `--- file1.txt
+++ file1.txt
@@ -1,3 +1,4 @@
 const hello = "world";
+const newLine = "added content";
 console.log(hello);
 // end of file`,
            },
            {
                expected: false,
                case: `--- file1.txt
+++ file1.txt
@@ -1,4 +1,3 @@
 const hello = "world";
-const removedLine = "some content";
 console.log(hello);
 // end of file`,
            },
            {
                expected: false,
                case: `--- file1.txt
+++ file1.txt
@@ -1,5 +1,5 @@
 const hello = "world";
-const oldLine = "remove this";
+
 console.log(hello);
-
+const newLine = "add this";
 // end of file`,
            },
        ]

        for (let i = 0; i < shouldReturnFalse.length; i++) {
            it(shouldReturnFalse[i].case, function () {
                const actual = isEditsInvolveEmptyLinesOnly(shouldReturnFalse[i].case)
                assert.strictEqual(actual, shouldReturnFalse[i].expected)
            })
        }
    })
})
