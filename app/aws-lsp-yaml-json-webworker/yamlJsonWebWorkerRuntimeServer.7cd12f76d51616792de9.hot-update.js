'use strict'
this['webpackHotUpdate_aws_lsp_yaml_json_webworker'](
    'yamlJsonWebWorkerRuntimeServer',
    {
        /***/ './src/yamlJsonWebWorkerRuntimeServer.ts':
            /*!***********************************************!*\
  !*** ./src/yamlJsonWebWorkerRuntimeServer.ts ***!
  \***********************************************/
            /***/ (__unused_webpack_module, exports, __webpack_require__) => {
                Object.defineProperty(exports, '__esModule', { value: true })
                const webworker_1 = __webpack_require__(
                    /*! @aws/language-server-runtimes/out/runtimes/webworker */ '../../node_modules/@aws/language-server-runtimes/out/runtimes/webworker.js'
                )
                const aws_lsp_yaml_json_1 = __webpack_require__(
                    Object(
                        (function webpackMissingModule() {
                            var e = new Error("Cannot find module '@aws/aws-lsp-yaml-json'")
                            e.code = 'MODULE_NOT_FOUND'
                            throw e
                        })()
                    )
                )
                const MAJOR = 0
                const MINOR = 1
                const PATCH = 0
                const VERSION = `${MAJOR}.${MINOR}.${PATCH}`
                const props = {
                    version: VERSION,
                    servers: [aws_lsp_yaml_json_1.YamlLanguageServer],
                    name: 'AWS YAML/JSON server',
                }
                ;(0, webworker_1.webworker)(props)
                //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieWFtbEpzb25XZWJXb3JrZXJSdW50aW1lU2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3lhbWxKc29uV2ViV29ya2VyUnVudGltZVNlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG9GQUFnRjtBQUVoRiw4REFBMkQ7QUFFM0QsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFBO0FBQ2YsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFBO0FBQ2YsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFBO0FBQ2YsTUFBTSxPQUFPLEdBQUcsR0FBRyxLQUFLLElBQUksS0FBSyxJQUFJLEtBQUssRUFBRSxDQUFBO0FBRTVDLE1BQU0sS0FBSyxHQUFpQjtJQUN4QixPQUFPLEVBQUUsT0FBTztJQUNoQixPQUFPLEVBQUUsQ0FBQyxzQ0FBa0IsQ0FBQztJQUM3QixJQUFJLEVBQUUsc0JBQXNCO0NBQy9CLENBQUE7QUFDRCxJQUFBLHFCQUFTLEVBQUMsS0FBSyxDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB3ZWJ3b3JrZXIgfSBmcm9tICdAYXdzL2xhbmd1YWdlLXNlcnZlci1ydW50aW1lcy9vdXQvcnVudGltZXMvd2Vid29ya2VyJ1xuaW1wb3J0IHsgUnVudGltZVByb3BzIH0gZnJvbSAnQGF3cy9sYW5ndWFnZS1zZXJ2ZXItcnVudGltZXMvb3V0L3J1bnRpbWVzL3J1bnRpbWUnXG5pbXBvcnQgeyBZYW1sTGFuZ3VhZ2VTZXJ2ZXIgfSBmcm9tICdAYXdzL2F3cy1sc3AteWFtbC1qc29uJ1xuXG5jb25zdCBNQUpPUiA9IDBcbmNvbnN0IE1JTk9SID0gMVxuY29uc3QgUEFUQ0ggPSAwXG5jb25zdCBWRVJTSU9OID0gYCR7TUFKT1J9LiR7TUlOT1J9LiR7UEFUQ0h9YFxuXG5jb25zdCBwcm9wczogUnVudGltZVByb3BzID0ge1xuICAgIHZlcnNpb246IFZFUlNJT04sXG4gICAgc2VydmVyczogW1lhbWxMYW5ndWFnZVNlcnZlcl0sXG4gICAgbmFtZTogJ0FXUyBZQU1ML0pTT04gc2VydmVyJyxcbn1cbndlYndvcmtlcihwcm9wcylcbiJdfQ==

                /***/
            },
    },
    /******/ function (__webpack_require__) {
        // webpackRuntimeModules
        /******/ /* webpack/runtime/getFullHash */
        /******/ ;(() => {
            /******/ __webpack_require__.h = () => 'cf494f19115dcb958bea'
            /******/
        })()
        /******/
        /******/
    }
)
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieWFtbEpzb25XZWJXb3JrZXJSdW50aW1lU2VydmVyLjdjZDEyZjc2ZDUxNjE2NzkyZGU5LmhvdC11cGRhdGUuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQWE7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0Qsb0JBQW9CLG1CQUFPLENBQUMsd0lBQXNEO0FBQ2xGLDRCQUE0QixtQkFBTyxDQUFDLHFKQUF3QjtBQUM1RDtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsTUFBTSxHQUFHLE1BQU0sR0FBRyxNQUFNO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJDQUEyQzs7Ozs7Ozs7VUNkM0MiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9AYXdzL2xzcC15YW1sLWpzb24td2Vid29ya2VyLy4vc3JjL3lhbWxKc29uV2ViV29ya2VyUnVudGltZVNlcnZlci50cyIsIndlYnBhY2s6Ly9AYXdzL2xzcC15YW1sLWpzb24td2Vid29ya2VyL3dlYnBhY2svcnVudGltZS9nZXRGdWxsSGFzaCJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IHdlYndvcmtlcl8xID0gcmVxdWlyZShcIkBhd3MvbGFuZ3VhZ2Utc2VydmVyLXJ1bnRpbWVzL291dC9ydW50aW1lcy93ZWJ3b3JrZXJcIik7XG5jb25zdCBhd3NfbHNwX3lhbWxfanNvbl8xID0gcmVxdWlyZShcIkBhd3MvYXdzLWxzcC15YW1sLWpzb25cIik7XG5jb25zdCBNQUpPUiA9IDA7XG5jb25zdCBNSU5PUiA9IDE7XG5jb25zdCBQQVRDSCA9IDA7XG5jb25zdCBWRVJTSU9OID0gYCR7TUFKT1J9LiR7TUlOT1J9LiR7UEFUQ0h9YDtcbmNvbnN0IHByb3BzID0ge1xuICAgIHZlcnNpb246IFZFUlNJT04sXG4gICAgc2VydmVyczogW2F3c19sc3BfeWFtbF9qc29uXzEuWWFtbExhbmd1YWdlU2VydmVyXSxcbiAgICBuYW1lOiAnQVdTIFlBTUwvSlNPTiBzZXJ2ZXInLFxufTtcbigwLCB3ZWJ3b3JrZXJfMS53ZWJ3b3JrZXIpKHByb3BzKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaWVXRnRiRXB6YjI1WFpXSlhiM0pyWlhKU2RXNTBhVzFsVTJWeWRtVnlMbXB6SWl3aWMyOTFjbU5sVW05dmRDSTZJaUlzSW5OdmRYSmpaWE1pT2xzaUxpNHZjM0pqTDNsaGJXeEtjMjl1VjJWaVYyOXlhMlZ5VW5WdWRHbHRaVk5sY25abGNpNTBjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lPenRCUVVGQkxHOUdRVUZuUmp0QlFVVm9SaXc0UkVGQk1rUTdRVUZGTTBRc1RVRkJUU3hMUVVGTExFZEJRVWNzUTBGQlF5eERRVUZCTzBGQlEyWXNUVUZCVFN4TFFVRkxMRWRCUVVjc1EwRkJReXhEUVVGQk8wRkJRMllzVFVGQlRTeExRVUZMTEVkQlFVY3NRMEZCUXl4RFFVRkJPMEZCUTJZc1RVRkJUU3hQUVVGUExFZEJRVWNzUjBGQlJ5eExRVUZMTEVsQlFVa3NTMEZCU3l4SlFVRkpMRXRCUVVzc1JVRkJSU3hEUVVGQk8wRkJSVFZETEUxQlFVMHNTMEZCU3l4SFFVRnBRanRKUVVONFFpeFBRVUZQTEVWQlFVVXNUMEZCVHp0SlFVTm9RaXhQUVVGUExFVkJRVVVzUTBGQlF5eHpRMEZCYTBJc1EwRkJRenRKUVVNM1FpeEpRVUZKTEVWQlFVVXNjMEpCUVhOQ08wTkJReTlDTEVOQlFVRTdRVUZEUkN4SlFVRkJMSEZDUVVGVExFVkJRVU1zUzBGQlN5eERRVUZETEVOQlFVRWlMQ0p6YjNWeVkyVnpRMjl1ZEdWdWRDSTZXeUpwYlhCdmNuUWdleUIzWldKM2IzSnJaWElnZlNCbWNtOXRJQ2RBWVhkekwyeGhibWQxWVdkbExYTmxjblpsY2kxeWRXNTBhVzFsY3k5dmRYUXZjblZ1ZEdsdFpYTXZkMlZpZDI5eWEyVnlKMXh1YVcxd2IzSjBJSHNnVW5WdWRHbHRaVkJ5YjNCeklIMGdabkp2YlNBblFHRjNjeTlzWVc1bmRXRm5aUzF6WlhKMlpYSXRjblZ1ZEdsdFpYTXZiM1YwTDNKMWJuUnBiV1Z6TDNKMWJuUnBiV1VuWEc1cGJYQnZjblFnZXlCWllXMXNUR0Z1WjNWaFoyVlRaWEoyWlhJZ2ZTQm1jbTl0SUNkQVlYZHpMMkYzY3kxc2MzQXRlV0Z0YkMxcWMyOXVKMXh1WEc1amIyNXpkQ0JOUVVwUFVpQTlJREJjYm1OdmJuTjBJRTFKVGs5U0lEMGdNVnh1WTI5dWMzUWdVRUZVUTBnZ1BTQXdYRzVqYjI1emRDQldSVkpUU1U5T0lEMGdZQ1I3VFVGS1QxSjlMaVI3VFVsT1QxSjlMaVI3VUVGVVEwaDlZRnh1WEc1amIyNXpkQ0J3Y205d2N6b2dVblZ1ZEdsdFpWQnliM0J6SUQwZ2UxeHVJQ0FnSUhabGNuTnBiMjQ2SUZaRlVsTkpUMDRzWEc0Z0lDQWdjMlZ5ZG1WeWN6b2dXMWxoYld4TVlXNW5kV0ZuWlZObGNuWmxjbDBzWEc0Z0lDQWdibUZ0WlRvZ0owRlhVeUJaUVUxTUwwcFRUMDRnYzJWeWRtVnlKeXhjYm4xY2JuZGxZbmR2Y210bGNpaHdjbTl3Y3lsY2JpSmRmUT09IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5oID0gKCkgPT4gKFwiY2Y0OTRmMTkxMTVkY2I5NThiZWFcIikiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=
