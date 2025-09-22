// ton.d.ts
import ton from './index'

// 1️⃣ 声明全局 wx（避免报错）
declare const wx: any

// 2️⃣ 声明全局 uni（如果项目没有自动类型注入）
declare const uni: any

// 3️⃣ 插件 API 容器（默认空，扩展时会合并）
declare module './index' {
  interface TonCustomApi {}
  
  // Ton 类型 = Proxy 封装的 ton + 自定义插件 API
  export interface Ton extends typeof ton, TonCustomApi {}

  const ton: Ton
  export default ton
}
