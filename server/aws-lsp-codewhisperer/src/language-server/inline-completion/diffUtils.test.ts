import * as diff from 'diff'
import * as assert from 'assert'

describe('test', function () {
    const originalCode = `    import { isEditsInvolveEmptyLinesOnly } from './nepUtils'
     
    describe('nepUtils', function () {
        describe('isEditsInvolveEmptyLinesOnly', function () {
            const shouldReturnTrue: { id: string, expected: boolean, case: string }[] = [
                {
                
                    expected: true,
                    case: \`--- file1.txt
    +++ file1.txt
    @@ -1,3 +1,4 @@
     const hello = "world";
    +
     console.log(hello);
     // end of file\`, 
                },
                {
                    expected: true,
                    case: \`--- file1.txt
    +++ file1.txt
    @@ -1,4 +1,3 @@
     const hello = "world";
    -
     console.log(hello);
     // end of file\`
                },
                {
                    expected: true,
                    case: \`--- file1.txt
    +++ file1.txt
    @@ -1,5 +1,5 @@
     const hello = "world";
    -
    +
     console.log(hello);
    -
    +
     // end of file\`
                }
            ];
     
            const shouldReturnFalse: { expected: boolean, case: string }[] = [
                {
                    expected: false,
                    case: \`--- file1.txt
    +++ file1.txt
    @@ -1,3 +1,4 @@
     const hello = "world";
    +const newLine = "added content";
     console.log(hello);
     // end of file\`
                },
                {
                    expected: false,
                    case: \`--- file1.txt
    +++ file1.txt
    @@ -1,4 +1,3 @@
     const hello = "world";
    -const removedLine = "some content";
     console.log(hello);
     // end of file\`
                },
                {
                    expected: false,
                    case: \`--- file1.txt
    +++ file1.txt
    @@ -1,5 +1,5 @@
     const hello = "world";
    -const oldLine = "remove this";
    +
     console.log(hello);
    -
    +const newLine = "add this";
     // end of file\`
                }
            ]
     
            it('', function () {
                const unifiedDiff = \`\`
                const actual = isEditsInvolveEmptyLinesOnly(unifiedDiff)
            })
        })
    })`

    it('does not work, applyDiff will fail', function () {
        const ud = `--- file:///Volumes/workplace/ide/language-servers/server/aws-lsp-codewhisperer/src/shared/nepUtils.test.ts
+++ file:///Volumes/workplace/ide/language-servers/server/aws-lsp-codewhisperer/src/shared/nepUtils.test.ts
@@ -2,10 +2,11 @@
 
 describe('nepUtils', function () {
     describe('isEditsInvolveEmptyLinesOnly', function () {
         const shouldReturnTrue: { id: string, expected: boolean, case: string }[] = [
             {
+                id: 'case1',
                 expected: true,
                 case: \`--- file1.txt
 +++ file1.txt
 @@ -1,3 +1,4 @@
  const hello = "world";`

        const res = diff.applyPatch(originalCode, ud, { fuzzFactor: 4 })
        assert.strictEqual(res, false)
    })

    it(`applyDiff should work`, function () {
        const ud = `--- file:///Volumes/workplace/ide/language-servers/server/aws-lsp-codewhisperer/src/shared/nepUtils.test.ts
+++ file:///Volumes/workplace/ide/language-servers/server/aws-lsp-codewhisperer/src/shared/nepUtils.test.ts
@@ -4,7 +4,7 @@
         describe('isEditsInvolveEmptyLinesOnly', function () {
             const shouldReturnTrue: { id: string, expected: boolean, case: string }[] = [
                 {
-                
+                    id: 'case1',
                     expected: true,
                     case: \`--- file1.txt
     +++ file1.txt`

        const res = diff.applyPatch(originalCode, ud, { fuzzFactor: 4 })
        assert.ok(res)
    })

    // it('t3', function () {
    //     const ud =
    //         "--- file:///Users/aritras/code-whisperer/gumtree/gumtree/core/src/main/java/com/github/gumtreediff/io/LineReader.java\n+++ file:///Users/aritras/code-whisperer/gumtree/gumtree/core/src/main/java/com/github/gumtreediff/io/LineReader.java\n@@ -57,14 +57,51 @@\n int r = reader.read(cbuf, off, len);\n for (int i = 0; i < len; i++) {\n if (cbuf[off + i] == '\\n') {\n lines.add(currentPos + i);\n }\\\n- currentPos += len;\n- return r;\n- }\n-\n+ currentPos += len;\\\n+ return r;\\\n+ }\\\n+\\\n+ @Override\\\n+ public void close() throws IOException {\\\n+ reader.close();\\\n+ }\\\n+\\\n+ /**\\\n+ * Converts a position given as a (line, column) into an offset.\\\n+ * \\\n+ * @param line in the associated stream\\\n+ * @param column in the associated stream\\\n+ * @return position as offset in the stream\\\n+ */\\\n+ public int positionFor(int line, int column) {\\\n+ if (lines.size() < line)\\\n+ return -1;\\\n+\\\n+ return lines.get(line - 1) + column; // Line and column starts at 1\\\n+ }\\\n+\\\n+ /**\\\n+ * Converts a position given as an offset into a (line, column) array.\\\n+ * \\\n+ * @param offset in the associated stream\\\n+ * @return position as (line, column) in the stream\\\n+ */\\\n+ public int[] positionFor(int offset) {\\\n+ int line = Arrays.binarySearch(lines.toArray(), offset);\\\n+ int off;\\\n+\\\n+ if (line < 0) {\\\n+ line = -(line) - 1; // If the offset is not in the lines array\\\n+ off = lines.get(line - 1); // Get offset of previous line\\\n+ } \\\n+ else {\\\n+ off = lines.get(line) - 1; // Get offset of current line - 1\\\n+ }\\\n+\\\n @Override\n public void close() throws IOException {\n reader.close();\n }\n "
    // })
})
