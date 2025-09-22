# Ton - UniApp / 小程序 API 封装插件

Ton 是一个轻量级 TypeScript 封装工具，用于统一封装 `uni` 和 `wx` API，支持：

- 自动 **Promise 化** 异步 API  
- **插件化扩展**自定义 API，优先覆盖原始 API  
- 保持同步 API 原有行为  
- 自动继承 `uni` / `wx` 类型声明，支持 TS 智能提示  

---

## 安装

```bash
# 直接拷贝 utils/ton.ts + typings/ 目录到你的项目
```

可选依赖（保证 TypeScript 类型完整）：

```bash
npm install --save-dev @dcloudio/types @types/wechat-miniprogram
```

---

## 使用方法

### 1. 引入 Ton

```ts
import ton from '@/ton.uni'
```

### 2. 调用内置 API

```ts
// 异步回调 API 会自动返回 Promise
async function pickImage() {
  const res = await ton.chooseImage({ count: 1 })
  console.log(res.tempFilePaths)
}

// 同步 API 保持原样
const info = ton.getSystemInfoSync()
console.log(info.platform)
```

### 3. 注册自定义插件 API

```ts
ton.use({
  showToast(msg: string) {
    return new Promise((resolve) => {
      uni.showToast({
        title: msg,
        icon: 'none',
        duration: 2000,
        success: resolve
      })
    })
  },

  request(options: UniApp.RequestOptions) {
    return new Promise((resolve, reject) => {
      uni.request({
        ...options,
        header: {
          ...(options.header || {}),
          'X-Custom-Header': 'ton'
        },
        success: resolve,
        fail: reject
      })
    })
  }
})
```

### 4. 调用自定义插件 API

```ts
await ton.showToast('操作成功')
const res = await ton.request({ url: '/api/user' })
```

---

## TypeScript 支持

- 基于 `typeof uni` 和 `typeof wx` 动态继承类型  
- 插件方法可以通过声明合并 (`TonCustomApi`) 添加类型提示  

示例：`typings/ton-extend.d.ts`

```ts
import '../src/utils/ton'

declare module '../src/utils/ton' {
  interface TonCustomApi {
    showToast(msg: string): Promise<void>
    request(options: UniApp.RequestOptions): Promise<UniApp.RequestSuccessCallbackResult>
  }
}
```

---

## 测试方法

使用 Jest + ts-jest 测试：

```ts
import ton from '@/utils/ton'

ton.use({
  showToast: (msg: string) => Promise.resolve(`Toast: ${msg}`)
})

describe('ton API', () => {
  it('should call plugin API', async () => {
    const res = await ton.showToast('hello')
    expect(res).toBe('Toast: hello')
  })
})
```

运行测试：

```bash
npm install --save-dev jest ts-jest @types/jest
npx ts-jest config:init
npm run test
```

---

## 特性总结

- ✅ 自动 Promise 化异步 API  
- ✅ 同步 API 保持原样  
- ✅ 插件化 API，优先覆盖原生 API  
- ✅ TS 类型自动继承 uni / wx  
- ✅ 支持 uni-app 和微信小程序  

---

## 注意事项

1. 确保 `tsconfig.json` 包含类型声明路径：

```json
{
  "include": ["src", "typings"]
}
```

2. 如果出现 `Cannot find name 'uni'` 或 `Cannot find name 'wx'`，请安装类型声明：

```bash
npm install --save-dev @dcloudio/types @types/wechat-miniprogram
```

3. 使用 `ton.use()` 注册自定义方法时，运行时优先调用插件方法，未注册的方法走原始 uni/wx API。