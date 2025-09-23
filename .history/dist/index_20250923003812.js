// 插件仓库
const customApiStore = {};
// 注册插件
function use(plugin) {
    Object.assign(customApiStore, plugin);
}
// 运行时代理
const baseApi = typeof uni !== 'undefined' ? uni :
    (typeof wx !== 'undefined' ? wx : {});
const ton = new Proxy({ use }, {
    get(target, prop) {
        if (typeof prop === 'symbol')
            return target[prop];
        if (prop in target)
            return target[prop];
        // 1️⃣ 插件方法优先
        if (prop in customApiStore) {
            return customApiStore[prop];
        }
        // 2️⃣ 原始 uni/wx
        const fn = baseApi[prop];
        if (typeof fn !== 'function')
            return undefined;
        target[prop] = (options = {}, ...args) => {
            const isCallbackStyle = options &&
                typeof options === 'object' &&
                ['success', 'fail', 'complete'].some(k => k in options);
            if (isCallbackStyle) {
                return new Promise((resolve, reject) => {
                    fn(Object.assign(Object.assign({}, options), { success: (res) => resolve(res), fail: (err) => reject(err), complete: options.complete }));
                });
            }
            else {
                return fn(options, ...args);
            }
        };
        return target[prop];
    }
});
export default ton;
