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
    // 网络
    "request", "downloadFile", "uploadFile", "requestPayment",
    // 文件
    "saveFile", "getFileInfo", "removeSavedFile", "getSavedFileList", "openDocument",
    // 存储
    "setStorage", "getStorage", "removeStorage", "clearStorage",
    // 媒体
    "chooseImage", "previewImage", "getImageInfo", "chooseVideo", "chooseMedia",
    "saveImageToPhotosAlbum", "saveVideoToPhotosAlbum",
    "startRecord", "stopRecord",
    "playVoice", "pauseVoice", "stopVoice",
    "getBackgroundAudioPlayerState", "playBackgroundAudio",
    "pauseBackgroundAudio", "stopBackgroundAudio", "seekBackgroundAudio",
    // 蓝牙/设备
    "startBluetoothDevicesDiscovery", "stopBluetoothDevicesDiscovery",
    "getBluetoothDevices", "getConnectedBluetoothDevices",
    "createBLEConnection", "closeBLEConnection",
    "writeBLECharacteristicValue", "readBLECharacteristicValue",
    "notifyBLECharacteristicValueChange", "onBluetoothDeviceFound",
    // 位置/地图
    "getLocation", "chooseLocation", "openLocation", "createMapContext",
    // 其他
    "login", "checkSession", "getUserInfo", "authorize",
    "getSetting", "openSetting",
    "showToast", "showModal", "showActionSheet",
    "startPullDownRefresh", "stopPullDownRefresh",
    "vibrateShort", "vibrateLong", "scanCode"
]);

// 运行时代理
const baseApi = typeof uni !== 'undefined' ? uni :
    (typeof wx !== 'undefined' ? wx : {});

const ton = new Proxy({ use }, {
    get(target, prop) {
        if (typeof prop === 'symbol') return target[prop];
        if (prop in target) return target[prop];

        // 插件方法优先
        if (prop in customApiStore) return customApiStore[prop];

        const fn = baseApi[prop];
        if (typeof fn !== 'function') return undefined;

        // 如果是异步 API，直接处理为 Promise 风格
        if (asyncApis.has(prop)) {
            target[prop] = (options = {}, ...args) => {
                const { $async, ...restOptions } = options || {};

                // 默认采用 Promise 风格，不需要再判断 $async
                return new Promise((resolve, reject) => {
                    fn({
                        ...restOptions,
                        success: res => resolve(res),
                        fail: err => reject(err)
                    }, ...args);
                });
            };
        } else {
            // 同步 API → 直接透传
            target[prop] = (...args) => fn(...args);
        }

        return target[prop];
    }
});

export default ton;
