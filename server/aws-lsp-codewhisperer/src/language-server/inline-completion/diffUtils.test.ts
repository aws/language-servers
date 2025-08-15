import * as assert from 'assert'
import { categorizeUnifieddiff } from './diffUtils'

describe('categorizeUnifieddiff', function () {
    const addOnlyCases = [
        `--- file:///Volumes/workplace/ide/sample_projects/Calculator/src/main/hello/MathUtil.java
+++ file:///Volumes/workplace/ide/sample_projects/Calculator/src/main/hello/MathUtil.java
@@ -4,6 +4,9 @@
         return a + b;
     }
 
     // write a function to subtract 2 numbers
     
+    public static int subtract(int a, int b) {
+        return a - b;
+    }
 }`,
    ]

    for (let i = 0; i < addOnlyCases.length; i++) {
        it(`addOnly case ${i}`, function () {
            const udiff = addOnlyCases[i]
            const r = categorizeUnifieddiff(udiff)
            assert.strictEqual(r, 'addOnly')
        })
    }

    const deleteOnlyCases = [
        `--- a/src/main/hello/MathUtil.java
+++ b/src/main/hello/MathUtil.java
@@ -1,9 +1,4 @@
 public class MathUtil {
-    // write a function to add 2 numbers
-    public static int add(int a, int b) {
-        return a + b;
-    }
-
     // write a function to subtract 2 numbers
     public static int subtract(int a, int b) {
         return a - b;`,
    ]

    for (let i = 0; i < deleteOnlyCases.length; i++) {
        it(`deleteOnly case ${i}`, function () {
            const udiff = deleteOnlyCases[i]
            const r = categorizeUnifieddiff(udiff)
            assert.strictEqual(r, 'deleteOnly')
        })
    }

    const both = [
        `--- a/src/main/hello/MathUtil.java
+++ b/src/main/hello/MathUtil.java
@@ -1,11 +1,11 @@
 public class MathUtil {
     // write a function to add 2 numbers
-    public static int add(int a, int b) {
+    public static double add(double a, double b) {
         return a + b;
     }
 
     // write a function to subtract 2 numbers
-    public static int subtract(int a, int b) {
+    public static double subtract(double a, double b) {
         return a - b;
     }   
 }`,
        `--- a/src/main/hello/MathUtil.java
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
    ]

    for (let i = 0; i < both.length; i++) {
        it(`both case ${i}`, function () {
            const udiff = both[i]
            const r = categorizeUnifieddiff(udiff)
            assert.strictEqual(r, 'both')
        })
    }
})
