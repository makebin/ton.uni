import ton from '../src/index'

// 模拟 uni / wx API
const mockUni = {
  chooseImage: jest.fn((options: any) => {
    if (options.success) options.success({ tempFilePaths: ['a.png'] })
  }),
  getSystemInfoSync: jest.fn(() => ({ platform: 'ios' }))
}

// 动态替换 baseApi
;(ton as any).__baseApi = mockUni

describe('ton API', () => {
  beforeAll(() => {
    // 注册自定义插件
    ton.use({
      showToast: (msg: string) => Promise.resolve(`Toast: ${msg}`)
    })
  })

  it('should call custom plugin first', async () => {
    const res = await ton.showToast('hello')
    expect(res).toBe('Toast: hello')
  })

  it('should wrap uni callback API as Promise', async () => {
    const res = await ton.chooseImage({ count: 1 })
    expect(res.tempFilePaths).toEqual(['a.png'])
    expect(mockUni.chooseImage).toHaveBeenCalled()
  })

  it('should keep sync API unchanged', () => {
    const info = ton.getSystemInfoSync()
    expect(info.platform).toBe('ios')
    expect(mockUni.getSystemInfoSync).toHaveBeenCalled()
  })
})
