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


// Promise 化
type Promisify<T> = {
  [K in keyof T]:
    T[K] extends (options: infer O, ...args: any[]) => any
      ? O extends { success?: any; fail?: any }
        ? (options: O) => Promise<any>
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

// 运行时代理
const baseApi: AnyObject =
  typeof uni !== 'undefined' ? uni :
  (typeof wx !== 'undefined' ? wx : {})

const ton = new Proxy({ use } as any, {
  get(target, prop: string) {
    if (typeof prop === 'symbol') return (target as any)[prop]
    if (prop in target) return (target as any)[prop]

    // 1️⃣ 插件方法优先
    if (prop in customApiStore) {
      return customApiStore[prop]
    }
    // 2️⃣ 原始 uni/wx
    const fn = baseApi[prop]
    if (typeof fn !== 'function') return undefined

    target[prop] = (options: any = {}, ...args: any[]) => {
      const isCallbackStyle =
        options &&
        typeof options === 'object' &&
        ['success', 'fail', 'complete'].some(k => k in options)

      if (isCallbackStyle) {
        return new Promise((resolve, reject) => {
          fn({
            ...options,
            success: (res: any) => resolve(res),
            fail: (err: any) => reject(err),
            complete: options.complete
          })
        })
      } else {
        return fn(options, ...args)
      }
    }
    return target[prop]
  }
})


export default ton
