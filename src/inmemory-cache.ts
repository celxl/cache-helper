
import NodeCache from 'node-cache';

enum ErrorHandlerRuleEnum {
    MANDATORY = 'mandatory',
    TYPE = 'data-type'
}

export interface IInMemoryCacheOptions {
    /**
     * @description
     * When false cache wont be used - useful for debugging proposes
     */
    cacheEnable: boolean;

    /**
     * @description
     * time in seconds for cache expiration 
     */
    cacheTtl: number;

}

interface IErrorHandlerOptions {
    name: string;
    value: string | boolean | number;
    rule: ErrorHandlerRuleEnum,
    type?: string
}

var instance: InMemoryCache;

/**
 * 
 */
class InMemoryCache {
    private _cache: NodeCache;
    private _cacheEnable: boolean;
    private _cacheTtl: number;

    constructor(options: IInMemoryCacheOptions) {
        this._errorHandler({
            name: 'options.cacheEnable',
            rule: ErrorHandlerRuleEnum.TYPE,
            type: 'boolean',
            value: options.cacheEnable
        });

        this._errorHandler({
            name: 'options.cacheTtl',
            rule: ErrorHandlerRuleEnum.TYPE,
            type: 'number',
            value: options.cacheTtl
        });
        
        this._cacheEnable = options.cacheEnable;
        this._cacheTtl = options.cacheTtl;
        this._cache = (this._cacheEnable) ? new NodeCache({ stdTTL: this._cacheTtl || 1 }) : null as unknown as NodeCache;
    }

    public get cacheTtl(): number {
        return this._cacheTtl;
    }

    /**
     * Process the callback argument, if function return its value,
     * is Promise wait for its completion and return the promise result
     * @param callback 
     * @returns Result of callback argument or null
     */
    private async _resolveCallback(callback?: ()=> any | Promise<any>): Promise<any> {
        let result: any = null;

        if (typeof callback == 'function') {
            result = callback() ;
        }

        if (callback instanceof Promise) {
            result = await callback;
        }

        return result;
    }

    /**
     * Get value from cache by its key,
     * optionally can pass a callback function|promise as argument 
     * to in case cache is empty resolve callback, set is result to cache and return 
     * NOTE: callback will run only if no cache for given key
     * NOTE: callback won't be executed at all if cache exist for key
     * @param key The cache key
     * @param callback 
     * @returns 
     */
    async get(key: string, callback?: ()=> any | Promise<any> ) {
        this._errorHandler({name: 'key', rule: ErrorHandlerRuleEnum.MANDATORY, value: key});
        
        if (!this._cache) return this._resolveCallback(callback);

        let result = this._cache.get(key) || null;

        if (!result) {
            result = await this._resolveCallback(callback);
            (result) && this.set(key, result);
        }

        return result;
    }

    /**
     * set a new cache key with its value
     * @param key 
     * @param value 
     */
    set(key: string, value: any ) {
        this._errorHandler({name: 'key', rule: ErrorHandlerRuleEnum.MANDATORY, value: key});

        if (!this._cache) return;

        this._cache.set(key, value);
    }

    /**
     * Delete/clear from cache the given key
     * @param key 
     * @returns 
     */
    delete(key: string) {
        this._errorHandler({name: 'key', rule: ErrorHandlerRuleEnum.MANDATORY, value: key});
        
        if (!this._cache) return;

        this._cache.del(key);
    }

    /**
     * clear the cache, by removing all keys - values
     */
    clear() {
        if (!this._cache) return;

        this._cache.flushAll();
    }

    /**
     * Return all keys in use
     * @returns string []
     */
    getKeys(): string[] {
        if (!this._cache) return [];

        return this._cache.keys();
    }

    isEnabled(): boolean {
        return this._cacheEnable;
    }


    /**
     * 
     * @param paramName 
     * @param paramValue 
     * @param paramType 
     * @returns 
     * @todo
     * Implement a more robust logic, as the library grows
     */
    private _errorHandler(options: IErrorHandlerOptions) {
        if(options.rule == ErrorHandlerRuleEnum.MANDATORY && options.value === undefined)
            throw new Error(`Missing argument exception: ${options.name} parameter is mandatory`);

        if(options.rule == ErrorHandlerRuleEnum.TYPE && typeof options.value !== options.type)
            throw new Error(`Type argument exception: ${options.name} parameter must be type ${options.type}`);
        
        return;
    }

}

export function getCacheInstance(options: IInMemoryCacheOptions): InMemoryCache{
    if(!instance) 
        instance = new InMemoryCache(options);

    return instance;
}

export type InMemoryCacheClass = InMemoryCache;

