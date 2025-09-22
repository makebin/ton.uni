import '../src/utils/ton'

declare module '../src/utils/ton' {
  interface TonCustomApi {
    showToast(msg: string): Promise<void>
    request(options: UniApp.RequestOptions): Promise<UniApp.RequestSuccessCallbackResult>
  }
}
