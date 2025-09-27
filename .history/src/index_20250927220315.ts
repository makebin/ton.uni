// ton.ts
type AnyObject = Record<string, any>;
type UniType = typeof uni;
type WxType = typeof wx;

// 合并 uni 和 wx 的 API 类型
type MergeApi<U, W> = {
  [K in keyof U | keyof W]:
    K extends keyof U ? U[K] :
    K extends keyof W ? W[K] : never;
};
type BaseApiType = MergeApi<UniType, WxType>;

// Promise 化类型
type Promisify<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => any
    ? A[0] extends { success?: any; fail?: any }
      ? (options?: Omit<A[0], 'success' | 'fail'> & { $async?: boolean }, ...args: A extends [any, ...infer R] ? R : []) => Promise<any>
      : T[K]
    : T[K]
};

// 插件方法类型
type PluginApi = Record<string, (...args: any[]) => any>;

// 插件仓库
const customApiStore: PluginApi = {};

// 注册插件
function use(plugin: PluginApi) {
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
const baseApi: AnyObject =
  typeof uni !== 'undefined' ? uni :
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
function beautifyLog(type: 'info' | 'success' | 'error' | 'warning', message: string) {
  const colors = {
    info: 'color: #0078d4; font-weight: bold;',
    success: 'color: #28a745; font-weight: bold;',
    error: 'color: #dc3545; font-weight: bold;',
    warning: 'color: #ffc107; font-weight: bold;',
  };
  return `%c${message}`, colors[type] || 'color: #000';
}

// Promise 化的类型
type TonType = Promisify<BaseApiType> & { use: (plugin: PluginApi) => void };

// ton: 运行时代理对象
const ton: TonType = new Proxy({ use } as any, {
  get(target, prop: string) {
    if (typeof prop === 'symbol') return (target as any)[prop];
    if (prop in target) return (target as any)[prop];

    // 插件方法优先
    if (prop in customApiStore) {
      return customApiStore[prop];
    }

    const fn = baseApi[prop];
    if (typeof fn !== 'function') return undefined;

    const isAsync = asyncApis.has(prop);

    // 打印日志
    if (logEnabled) {
      console.log(beautifyLog('info', `Calling ${isAsync ? 'async' : 'sync'} function: ${prop}`));
    }

    if (!isAsync) {
      // 同步 API → 直接透传
      target[prop] = (...args: any[]) => {
        if (logEnabled) {
          console.log(beautifyLog('info', `Arguments:`), args);
        }
        return fn(...args);
      };
    } else {
      // 异步 API → 支持 $async 参数
      target[prop] = (options: any = {}, ...args: any[]) => {
        const { $async, ...restOptions } = options || {};

        if (logEnabled) {
          console.log(beautifyLog('info', `Arguments:`), args);
          console.log(beautifyLog('info', `Options:`), restOptions);
        }

        if ($async === false) {
          // 回调风格
          return fn(restOptions, ...args);
        }

        // Promise 风格
        return new Promise((resolve, reject) => {
          fn(
            {
              ...restOptions,
              success: (res: any) => {
                if (logEnabled) {
                  console.log(beautifyLog('success', `Success: ${prop}`));
                  console.log(beautifyLog('success', `Response:`), res);
                }
                resolve(res);
              },
              fail: (err: any) => {
                if (logEnabled) {
                  console.log(beautifyLog('error', `Error: ${prop}`));
                  console.log(beautifyLog('error', `Error:`), err);
                }
                reject(err);
              }
            },
            ...args
          );
        });
      };
    }

    return target[prop];
  }
});

export default ton;
export { enableLog, disableLog };
