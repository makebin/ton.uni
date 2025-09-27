var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
// 插件仓库
const customApiStore = {};
// 注册插件
function use(plugin) {
    Object.assign(customApiStore, plugin);
}
// 常用异步 API 列表
const asyncApis = new Set([
    "request", "downloadFile", "uploadFile", "requestPayment",
    "saveFile", "getFileInfo", "removeSavedFile", "getSavedFileList", "openDocument",
    "setStorage", "getStorage", "removeStorage", "clearStorage",
    "chooseImage", "previewImage", "getImageInfo", "chooseVideo", "chooseMedia",
    "saveImageToPhotosAlbum", "saveVideoToPhotosAlbum",
    "startRecord", "stopRecord",
    "playVoice", "pauseVoice", "stopVoice",
    "getBackgroundAudioPlayerState", "playBackgroundAudio",
    "pauseBackgroundAudio", "stopBackgroundAudio", "seekBackgroundAudio",
    "startBluetoothDevicesDiscovery", "stopBluetoothDevicesDiscovery",
    "getBluetoothDevices", "getConnectedBluetoothDevices",
    "createBLEConnection", "closeBLEConnection",
    "writeBLECharacteristicValue", "readBLECharacteristicValue",
    "notifyBLECharacteristicValueChange", "onBluetoothDeviceFound",
    "getLocation", "chooseLocation", "openLocation", "createMapContext",
    "login", "checkSession", "getUserInfo", "authorize",
    "getSetting", "openSetting",
    "showToast", "showModal", "showActionSheet",
    "startPullDownRefresh", "stopPullDownRefresh",
    "vibrateShort", "vibrateLong", "scanCode"
]);
// 运行时代理
const baseApi = typeof uni !== 'undefined' ? uni :
    (typeof wx !== 'undefined' ? wx : {});
// 日志开关
let logEnabled = false;
// 启用日志
function enableLog() {
    logEnabled = true;
}
// 禁用日志
function disableLog() {
    logEnabled = false;
}
// 日志美化函数
function beautifyLog(type, message) {
    const colors = {
        info: 'color: #0078d4; font-weight: bold;',
        success: 'color: #28a745; font-weight: bold;',
        error: 'color: #dc3545; font-weight: bold;',
        warning: 'color: #ffc107; font-weight: bold;',
    };
    // 返回一个数组，包含格式化的消息和样式
    return [`%c${message}`, colors[type] || 'color: #000'];
}
// ton: 运行时代理对象
const ton = new Proxy({ use }, {
    get(target, prop) {
        if (typeof prop === 'symbol')
            return target[prop];
        if (prop in target)
            return target[prop];
        // 插件方法优先
        if (prop in customApiStore) {
            return customApiStore[prop];
        }
        const fn = baseApi[prop];
        if (typeof fn !== 'function')
            return undefined;
        const isAsync = asyncApis.has(prop);
        // 打印日志
        if (logEnabled) {
            console.log(beautifyLog('info', `Calling ${isAsync ? 'async' : 'sync'} function: ${prop}`));
        }
        if (isAsync) {
            // 异步 API → 直接处理为 Promise 风格
            target[prop] = (options = {}, ...args) => {
                const _a = options || {}, { $async } = _a, restOptions = __rest(_a, ["$async"]);
                // 打印日志
                if (logEnabled) {
                    console.log(beautifyLog('info', `Arguments:`), args);
                    console.log(beautifyLog('info', `Options:`), restOptions);
                }
                // Promise 风格
                return new Promise((resolve, reject) => {
                    fn(Object.assign(Object.assign({}, restOptions), { success: (res) => {
                            if (logEnabled) {
                                console.log(beautifyLog('success', `Success: ${prop}`));
                                console.log(beautifyLog('success', `Response:`), res);
                            }
                            resolve(res);
                        }, fail: (err) => {
                            if (logEnabled) {
                                console.log(beautifyLog('error', `Error: ${prop}`));
                                console.log(beautifyLog('error', `Error:`), err);
                            }
                            reject(err);
                        } }), ...args);
                });
            };
        }
        else {
            // 非异步 API → 根据 $async 参数判断是否使用 Promise 风格
            target[prop] = (options = {}, ...args) => {
                const _a = options || {}, { $async } = _a, restOptions = __rest(_a, ["$async"]);
                // 打印日志
                if (logEnabled) {
                    console.log(beautifyLog('info', `Calling sync function: ${prop}`));
                    console.log(beautifyLog('info', `Arguments:`), args);
                    console.log(beautifyLog('info', `Options:`), restOptions);
                }
                // 如果有 $async 参数并且为 true，则使用 Promise 风格
                if ($async === true) {
                    return new Promise((resolve, reject) => {
                        fn(Object.assign(Object.assign({}, restOptions), { success: (res) => {
                                if (logEnabled) {
                                    console.log(beautifyLog('success', `Success: ${prop}`));
                                    console.log(beautifyLog('success', `Response:`), res);
                                }
                                resolve(res);
                            }, fail: (err) => {
                                if (logEnabled) {
                                    console.log(beautifyLog('error', `Error: ${prop}`));
                                    console.log(beautifyLog('error', `Error:`), err);
                                }
                                reject(err);
                            } }), ...args);
                    });
                }
                // 否则使用回调风格
                return fn(restOptions, ...args);
            };
        }
        return target[prop];
    }
});
export default ton;
export { enableLog, disableLog };
