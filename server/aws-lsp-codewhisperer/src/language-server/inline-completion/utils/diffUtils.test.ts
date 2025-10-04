import * as assert from 'assert'
import { categorizeUnifieddiff, extractAdditions, removeOverlapCodeFromSuggestion } from './diffUtils'

describe('extractAdditions', function () {
    it('singleline', function () {
        const udiff = `--- file:///Volumes/workplace/ide/sample_projects/Calculator/src/main/hello/MathUtil.java
+++ file:///Volumes/workplace/ide/sample_projects/Calculator/src/main/hello/MathUtil.java
@@ -1,9 +1,10 @@
 public class MathUtil {
     // write a function to add 2 numbers
     public static int add(int a, int b) {
 
+        return a + b;
     }
 
     // write a function to subtract 2 numbers
     public static int subtract(int a, int b) {
         return a - b;`

        const r = extractAdditions(udiff)
        assert.strictEqual(r, '        return a + b;')
    })

    it('multiline', function () {
        const udiff = `--- file:///Volumes/workplace/ide/sample_projects/Calculator/src/main/hello/MathUtil.java
+++ file:///Volumes/workplace/ide/sample_projects/Calculator/src/main/hello/MathUtil.java
@@ -1,9 +1,17 @@
 public class MathUtil {
     // write a function to add 2 numbers
     public static int add(int a, int b) { 

+        if (a > Integer.MAX_VALUE - b){
+            throw new IllegalArgumentException("Overflow!");
+        }
+        else if (a < Integer.MIN_VALUE - b){
+            throw new IllegalArgumentException("Underflow");
+        }
+        else{
+            return a + b;
+        }
     }
 
     // write a function to subtract 2 numbers
     public static int subtract(int a, int b) {
         return a - b;`

        const r = extractAdditions(udiff)
        assert.strictEqual(
            r,
            `        if (a > Integer.MAX_VALUE - b){
            throw new IllegalArgumentException("Overflow!");
        }
        else if (a < Integer.MIN_VALUE - b){
            throw new IllegalArgumentException("Underflow");
        }
        else{
            return a + b;
        }`
        )
    })
})

describe('categorizeUnifieddiffV2v2 should return correct type (addOnly, edit, deleteOnly)', function () {
    interface Case {
        udiff: string
    }

    describe('addOnly', function () {
        const addOnlyCases: Case[] = [
            {
                udiff: `--- file:///Volumes/workplace/ide/sample_projects/Calculator-2/src/main/hello/MathUtil.java
+++ file:///Volumes/workplace/ide/sample_projects/Calculator-2/src/main/hello/MathUtil.java
@@ -6,7 +6,11 @@
 
     // write a function to subtract 2 numbers
      public static int subtract(int a, int b) {
         return a - b;
     }
-    
+
+    // write a function to multiply 2 numbers
+    public static int multiply(int a, int b) {
+        return a * b;
+    }
 }`,
            },
            {
                udiff: `--- file:///Volumes/workplace/ide/sample_projects/Calculator-2/src/main/hello/MathUtil.java
+++ file:///Volumes/workplace/ide/sample_projects/Calculator-2/src/main/hello/MathUtil.java
@@ -6,7 +6,11 @@
 
     // write a function to subtract 2 numbers
      public static int subtract(int a, int b) {
         return a - b;
     }
-    
+
+
+    // write a function to multiply 2 numbers
+    public static int multiply(int a, int b) {
+        return a * b;
+    }
 }`,
            },
            {
                udiff: `--- file:///Volumes/workplace/ide/sample_projects/Calculator-2/src/main/hello/MathUtil.java
+++ file:///Volumes/workplace/ide/sample_projects/Calculator-2/src/main/hello/MathUtil.java
@@ -6,7 +6,11 @@
 
     // write a function to subtract 2 numbers
      public static int subtract(int a, int b) {
         return a - b;
     }
-    
+      
+    // write a function to multiply 2 numbers
+    public static int multiply(int a, int b) {
+        return a * b;
+    }
 }`,
            },
            {
                udiff: `--- file:///Volumes/workplace/ide/sample_projects/Calculator/src/main/hello/MathUtil.java
+++ file:///Volumes/workplace/ide/sample_projects/Calculator/src/main/hello/MathUtil.java
@@ -1,9 +1,10 @@
 public class MathUtil {
     // write a function to add 2 numbers
     public static int add(int a, int b) {

+        return a + b;
     }

     // write a function to subtract 2 numbers
     public static int subtract(int a, int b) {
         return a - b;`,
            },
            {
                udiff: `--- file:///Volumes/workplace/ide/sample_projects/Calculator-2/src/main/hello/MathUtil.java
+++ file:///Volumes/workplace/ide/sample_projects/Calculator-2/src/main/hello/MathUtil.java
@@ -3,7 +3,9 @@
     public static int add(int a, int b) {
         return a + b;
     }
 
     // write a function to subtract 2 numbers
-    
+    public static int subtract(int a, int b) {
+        return a - b;
+    }
 }`,
            },
            {
                udiff: `--- file:///Volumes/workplace/ide/sample_projects/Calculator-2/src/main/hello/MathUtil.java
+++ file:///Volumes/workplace/ide/sample_projects/Calculator-2/src/main/hello/MathUtil.java
@@ -4,8 +4,8 @@
         return a + b;
     }
 
     // write a function to subtract 2 numbers
     public static int subtract(int a, int b) {
-        return 
+        return a - b;
     }
 }`,
            },
        ]

        for (let i = 0; i < addOnlyCases.length; i++) {
            it(`case ${i}`, function () {
                const actual = categorizeUnifieddiff(addOnlyCases[i].udiff)
                assert.strictEqual(actual, 'addOnly')
            })
        }
    })

    describe('edit', function () {
        const cases: Case[] = [
            {
                udiff: `--- a/src/main/hello/MathUtil.java
+++ b/src/main/hello/MathUtil.java
@@ -1,11 +1,11 @@
 public class MathUtil {
     // write a function to add 2 numbers
-    public static int add(int a, int b) {
+    public static double add(double a, double b) {
         return a + b;
     }
 
     // write a function to subtract 2 numbers
     public static int subtract(int a, int b) {
     public static double subtract(double a, double b) {
         return a - b;
     }   
 }`,
            },
            {
                udiff: `--- a/server/aws-lsp-codewhisperer/src/shared/codeWhispererService.ts
+++ b/server/aws-lsp-codewhisperer/src/shared/codeWhispererService.ts
@@ -502,11 +502,7 @@ export class CodeWhispererServiceToken extends CodeWhispererServiceBase {
             : undefined
     }
 
-    private withProfileArn<T extends object>(request: T): T {
-        if (!this.profileArn) return request
-
-        return { ...request, profileArn: this.profileArn }
-    }
+   // ddddddddddddddddd
 
     async generateSuggestions(request: BaseGenerateSuggestionsRequest): Promise<GenerateSuggestionsResponse> {
         // Cast is now safe because GenerateTokenSuggestionsRequest extends GenerateCompletionsRequest`,
            },
            {
                udiff: `--- file:///Users/atona/workplace/NEP/language-servers/server/aws-lsp-codewhisperer/src/language-server/inline-completion/utils/textDocumentUtils.ts
+++ file:///Users/atona/workplace/NEP/language-servers/server/aws-lsp-codewhisperer/src/language-server/inline-completion/utils/textDocumentUtils.ts
@@ -15,11 +15,11 @@
         return ''
     }
 }
 
 export const getTextDocument = async (uri: string, workspace: any, logging: any): Promise<TextDocument | undefined> => {
-    let 
+    if (!textDocument) {
     if (!textDocument) {
         try {
             const content = await workspace.fs.readFile(URI.parse(uri).fsPath)
             const languageId = getLanguageIdFromUri(uri)
             textDocument = TextDocument.create(uri, languageId, 0, content)`,
            },
        ]

        for (let i = 0; i < cases.length; i++) {
            it(`case ${i}`, function () {
                const actual = categorizeUnifieddiff(cases[i].udiff)
                assert.strictEqual(actual, 'edit')
            })
        }
    })
})

describe('removeOverlapCodeFromSuggestion', function () {
    interface Case {
        s1: string
        s2: string
        expected: string
    }

    const cases: Case[] = [
        {
            s1: `return`,
            s2: `return a + b`,
            expected: ` a + b`,
        },
        {
            s1: `    `,
            s2: `return a + b`,
            expected: `return a + b`,
        },
        {
            s1: `    System.out.print`,
            s2: `println("a + b =", a + b)
return a + b`,
            expected: `ln("a + b =", a + b)
return a + b`,
        },
    ]

    for (let i = 0; i < cases.length; i++) {
        it(`test case${i}`, function () {
            const c = cases[i]
            const actual = removeOverlapCodeFromSuggestion(c.s1, c.s2)
            assert.strictEqual(actual, c.expected)
        })
    }
})
