// ton.ts
type AnyObject = Record<string, any>
type UniType = typeof uni
type WxType = typeof wx

// 合并 uni 和 wx
type MergeApi<U, W> = {
  [K in keyof U | keyof W]:
    K extends keyof U ? U[K] :
    K extends keyof W ? W[K] : never
}
type BaseApiType = MergeApi<UniType, WxType>

// Promise 化类型
type Promisify<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => any
    ? A[0] extends { success?: any; fail?: any }
      ? (options?: Omit<A[0], 'success' | 'fail'> & { $async?: boolean }, ...args: A extends [any, ...infer R] ? R : []) => Promise<any>
      : T[K]
    : T[K]
}

// 插件方法类型
type PluginApi = Record<string, (...args: any[]) => any>

// 插件仓库
const customApiStore: PluginApi = {}

// 注册插件
function use(plugin: PluginApi) {
  Object.assign(customApiStore, plugin)
}

// 常用异步 API 列表
const asyncApis = new Set([
  // 网络
  "request", "downloadFile", "uploadFile",
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
])

// 运行时代理
const baseApi: AnyObject =
  typeof uni !== 'undefined' ? uni :
  (typeof wx !== 'undefined' ? wx : {})

type TonType = Promisify<BaseApiType> & { use: (plugin: PluginApi) => void }

const ton: TonType = new Proxy({ use } as any, {
  get(target, prop: string) {
    if (typeof prop === 'symbol') return (target as any)[prop]
    if (prop in target) return (target as any)[prop]

    // 插件方法优先
    if (prop in customApiStore) {
      return customApiStore[prop]
    }

    const fn = baseApi[prop]
    if (typeof fn !== 'function') return undefined

    const isAsync = asyncApis.has(prop)

    if (!isAsync) {
      // 同步 API → 直接透传
      target[prop] = (...args: any[]) => fn(...args)
    } else {
      // 异步 API → 支持 $async 参数
      target[prop] = (options: any = {}, ...args: any[]) => {
        const { $async, ...restOptions } = options || {}

        if ($async === false) {
          // 回调风格
          return fn(restOptions, ...args)
        }

        // Promise 风格
        return new Promise((resolve, reject) => {
          fn(
            {
              ...restOptions,
              success: (res: any) => resolve(res),
              fail: (err: any) => reject(err)
            },
            ...args
          )
        })
      }
    }

    return target[prop]
  }
})

export default ton
