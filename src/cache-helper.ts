
import { RedisClientOptions } from "redis";

export enum CacheTypeEnum  {
    "redis" = "redis",
    "in-memory" = "in-memory"
}

export interface ICacheHelperOptions {
    type: keyof typeof CacheTypeEnum;
    cacheTtl: number;
    cacheEnable: boolean
    keyPrefix?: string;
    redisOptions?: RedisClientOptions
}

export enum ErrorHandlerRuleEnum {
    MANDATORY = 'mandatory',
    TYPE = 'data-type'
}

interface IErrorHandlerOptions {
    name: string;
    value: string | boolean | number;
    rule: ErrorHandlerRuleEnum,
    type?: string
}




export class CacheHelper {
    cache: any ;
    cacheEnable: boolean;
    cacheTtl: number;
    keyPrefix: string;

    constructor(options: ICacheHelperOptions){
        this.errorHandler({
            name: 'options.cacheEnable',
            rule: ErrorHandlerRuleEnum.TYPE,
            type: 'boolean',
            value: options.cacheEnable
        });

        this.errorHandler({
            name: 'options.cacheTtl',
            rule: ErrorHandlerRuleEnum.TYPE,
            type: 'number',
            value: options.cacheTtl
        });

        this.cacheTtl = options.cacheTtl;
        this.cacheEnable = options.cacheEnable;
        this.keyPrefix = options.keyPrefix || '';
    }

    getKey(key: string): string {
        return (this.keyPrefix)? this.keyPrefix + "-" + key: key;
    }   


    /**
     * Process the callback argument, if function return its value,
     * is Promise wait for its completion and return the promise result
     * @param callback 
     * @returns Result of callback argument or null
     */
    async resolveCallback(callback?: ()=> any | Promise<any>): Promise<any> {
        let result: any = null;
        
        if (typeof callback == 'function') {
            result = await callback() ;
        }

        if (callback instanceof Promise) {
            result = await callback;
        }

        return result;
    }

    errorHandler(options: IErrorHandlerOptions) {
        if(options.rule == ErrorHandlerRuleEnum.MANDATORY && options.value === undefined)
            throw new Error(`Missing argument exception: ${options.name} parameter is mandatory`);

        if(options.rule == ErrorHandlerRuleEnum.TYPE && typeof options.value !== options.type)
            throw new Error(`Type argument exception: ${options.name} parameter must be type ${options.type}`);
        
        return;
    }

    /**
     * Get value from cache by its key,
     * optionally can pass a callback function|promise as argument 
     * to in case cache is empty resolve callback, set is result to cache and return 
     * NOTE: callback will run only if no cache for given key
     * NOTE: callback won't be executed at all if cache exist for key
     * @param key The cache key
     * @param _callback 
     * @returns 
     */
    // @ts-ignore
    async get<T>(key: string, _callback?: ()=> T | Promise<T> ): Promise<T | null> { 
        this.errorHandler({name: 'key', rule: ErrorHandlerRuleEnum.MANDATORY, value: key});
    }

    /**
     * set a new cache key with its value
     * @param key 
     * @param _value 
     */
    async set(key: string, _value: any ) {
        this.errorHandler({name: 'key', rule: ErrorHandlerRuleEnum.MANDATORY, value: key});
    }

    /**
     * Delete/clear from cache the given key
     * @param key 
     * @returns 
     */
    async delete(key: string) {
        this.errorHandler({name: 'key', rule: ErrorHandlerRuleEnum.MANDATORY, value: key});
    }

    /**
     * clear the cache, by removing all keys - values
     */
    async clear() { }

    /**
     * Return all keys in use
     * @returns string []
     */
    async getKeys(): Promise<string[]> {return[];}

    isEnabled(): boolean {
        return this.cacheEnable;
    }

}


