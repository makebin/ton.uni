type UniType = typeof uni;
type WxType = typeof wx;
type MergeApi<U, W> = {
    [K in keyof U | keyof W]: K extends keyof U ? U[K] : K extends keyof W ? W[K] : never;
};
type BaseApiType = MergeApi<UniType, WxType>;
type Promisify<T> = {
    [K in keyof T]: T[K] extends (...args: infer A) => any ? A[0] extends {
        success?: any;
        fail?: any;
    } ? (options?: Omit<A[0], 'success' | 'fail'> & {
        $async?: boolean;
    }, ...args: A extends [any, ...infer R] ? R : []) => Promise<any> : T[K] : T[K];
};
type PluginApi = Record<string, (...args: any[]) => any>;
type TonType = Promisify<BaseApiType> & {
    use: (plugin: PluginApi) => void;
};
declare const ton: TonType;
export default ton;
