
import NodeCache from 'node-cache';
import { CacheHelper,  ICacheHelperOptions } from './cache-helper';




/**
 * 
 */
export class InMemoryCache extends CacheHelper{

    constructor(options: ICacheHelperOptions ) {
        super(options);
        this.cache = (this.cacheEnable) ? new NodeCache({ stdTTL: this.cacheTtl }) : null as unknown as NodeCache;
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
        super.get(key, callback);
        
        if (!this.cache) return this.resolveCallback(callback);

        let result = this.cache.get(this.getKey(key)) || null;

        if (!result) {
            result = await this.resolveCallback(callback);
            (result) && this.set(this.getKey(key), result);
        }

        return result;
    }

    /**
     * set a new cache key with its value
     * @param key 
     * @param value 
     */
    async set(key: string, value: any ) {
        super.set(key, value);
        if (!this.cache) return;

        this.cache.set(this.getKey(key), value);
    }

    /**
     * Delete/clear from cache the given key
     * @param key 
     * @returns 
     */
    async delete(key: string) {
        super.delete(key);
        
        if (!this.cache) return;

        this.cache.del(this.getKey(key));
    }

    /**
     * clear the cache, by removing all keys - values
     */
    async clear() {
        if (!this.cache) return;

        this.cache.flushAll();
    }

    /**
     * Return all keys in use
     * @returns string []
     */
    async getKeys(): Promise<string[]> {
        if (!this.cache) return [];

        const keys =  this.cache.keys();
        if (this.keyPrefix) {
            let regex = new RegExp(`^${this.keyPrefix}-`,'g');
            for (let i = 0; i < keys.length; i++) {
                keys[i] = keys[i].replace(regex,"");
            }
        }

        return keys || [];
    }


}


export type InMemoryCacheClass = InMemoryCache;

