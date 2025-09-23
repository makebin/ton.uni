// 插件仓库
const customApiStore = {};
function use(plugin) {
    Object.assign(customApiStore, plugin);
}

const baseApi =
    typeof uni !== "undefined"
        ? uni
        : typeof wx !== "undefined"
            ? wx
            : {};

// 常用异步 API 列表
const asyncApis = new Set([
    // 网络
    "request", "downloadFile", "uploadFile",
    // 文件
    "saveFile", "getFileInfo", "removeSavedFile", "getSavedFileList", "openDocument",
    // 存储
    "setStorage", "getStorage", "removeStorage", "clearStorage",
    // 媒体
    "chooseImage", "previewImage", "getImageInfo", "chooseVideo", "chooseMedia"
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

const ton = new Proxy({ use }, {
    get(target, prop) {
        if (typeof prop === "symbol") return target[prop];
        if (prop in target) return target[prop];

        // 插件方法优先
        if (prop in customApiStore) {
            return customApiStore[prop];
        }

        const fn = baseApi[prop];
        if (typeof fn !== "function") return undefined;

        // 判断是否异步 API
        const isAsync = asyncApis.has(prop);

        if (!isAsync) {
            // 同步 API → 直接透传
            target[prop] = (...args) => fn(...args);
        } else {
            // 异步 API → 首次绑定固定函数
            const normalAsyncFn = (options = {}, ...args) =>
                new Promise((resolve, reject) => {
                    fn(
                        {
                            ...options,
                            success: (res) => resolve(res),
                            fail: (err) => reject(err),
                        },
                        ...args
                    );
                });

            const forcedAsyncFn = (options = {}, ...args) => {
                const { $async, ...restOptions } = options || {};
                return new Promise((resolve, reject) => {
                    fn(
                        {
                            ...restOptions,
                            success: (res) => resolve(res),
                            fail: (err) => reject(err),
                        },
                        ...args
                    );
                });
            };

            // target[prop] 统一函数：根据 $async 决定
            target[prop] = (options = {}, ...args) =>
                options && options.$async === true
                    ? forcedAsyncFn(options, ...args)
                    : normalAsyncFn(options, ...args);
        }

        return target[prop];
    }
});

export default ton;
