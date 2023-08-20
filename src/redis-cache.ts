import { createClient, RedisClientType } from 'redis';
import { CacheHelper, ICacheHelperOptions } from './cache-helper';

export { RedisClientOptions, RedisClientType } from 'redis';


export class RedisCache extends CacheHelper {
    cache: RedisClientType;
    constructor(options: ICacheHelperOptions, redisClient: RedisClientType) {
        super(options)
        this.cache = redisClient;

        this.cache?.on('error', (err) => {
            if (err?.code === 'ECONNREFUSED')
                this.cacheEnable = false;
            this.cache.on('ready', () => {
                this.cacheEnable = true;
            });
        });

    }


    static async build(options: ICacheHelperOptions): Promise<RedisCache> {
        const config = { ...options.redisOptions };

        config.socket = { ...options?.redisOptions?.socket };

        const redisClient = createClient(config);

        if (options.cacheEnable) {


            await redisClient.connect()
                .catch(async (err: any) => {
                    throw new Error(`RedisCacheError: ${err}`);
                });
        }

        return new RedisCache(options, redisClient as unknown as RedisClientType);
    }

    /**
     * Creates new cache value for given key
     * @param redisClientInstance 
     * @param key 
     * @param value 
     * @param ttl time in seconds for expiration
     */
    async set(key: string, value: any) {
        super.set(key, value);

        if (!this.cacheEnable) return;

        let serialized = this._serializeValue(value);

        await this.cache.set(this.getKey(key), serialized,)
            .catch((err: any) => {
                throw new Error(`RedisCacheError: ${err}`);
            });

        await this.cache.expire(this.getKey(key), this.cacheTtl)
            .catch((err: any) => {
                throw new Error(`RedisCacheError: ${err}`);
            });;
    }

    /**
     * Return the stored value for given key
     * @param redisClientInstance 
     * @param key 
     * @returns 
     */
    async get(key: string, callback?: () => any): Promise<any> {
        await super.get(key, callback);

        if (!this.cacheEnable) return await this.resolveCallback(callback);


        let deserialized = await this.cache.get(this.getKey(key))
            .catch((err: any) => {
                throw new Error(`RedisCacheError: ${err}`);
            });

        if (deserialized === null) {
            let result = await this.resolveCallback(callback);
            (result) && this.set(key, result);

            return result;
        }

        return this._deserializeValue(deserialized as string);
    }

    /**
     * Return all stored key, when used a prefix key will return only keys with the given prefix
     * @param redisClientInstance 
     * @param keyPrefix optional a prefix for keys
     * @returns 
     */
    async getKeys(): Promise<string[]> {
        if (!this.cacheEnable) return [];

        let
            pattern = (this.keyPrefix) ? `${this.keyPrefix}*` : '*',
            keys = await this.cache.keys(pattern);


        if (this.keyPrefix) {
            let regex = new RegExp(`^${this.keyPrefix}-`, 'g');
            for (let i = 0; i < keys.length; i++) {
                keys[i] = keys[i].replace(regex, "");
            }
        }

        return keys || [];
    }

    /**
     * Delete key from cache
     * @param key 
     */
    async delete(key: string) {
        super.delete(key);
        if (!this.cacheEnable) return;

        await this.cache.del(this.getKey(key))
            .catch((err: any) => {
                throw new Error(`RedisCacheError: ${err}`);
            });
    }

    /**
     * Delete all stored keys, when used with prefixKey will delete only keys prefixed with keyPrefix
     * @param redisClientInstance 
     * @param keyPrefix 
     */
    async clear() {
        if (!this.cacheEnable) return;


        let
            delPromise = [],
            pattern = (this.keyPrefix) ? `${this.keyPrefix}*` : '*',
            keys = await this.cache.keys(pattern);

        for (const iterator of keys)
            delPromise.push(this.cache.del(iterator));

        await Promise.all(delPromise).catch((err: any) => {
            throw new Error(`RedisCacheError: ${err}`);
        });
    }

    /**
     * Flush cache. Be careful using this method, specially if working in microservice architecture
     * where several microservices use a common redis host, this method will clear everything.
     * @param redisClientInstance 
     */
    async clearCache(redisClientInstance: RedisClientType) {
        await redisClientInstance.flushAll();
    }

    /**
     * return serialized string from value
     * @param value 
     * @returns 
     */
    private _serializeValue(value: any): string {
        switch (typeof value) {
            case 'string':
                return 'string:' + value;
            case 'number':
                return 'number:' + value.toString();
            case 'object':
                return 'object:' + JSON.stringify(value);
            case 'boolean':
                return 'boolean:' + value.toString();
            default:
                throw new Error(`Unprocessable type of value: ${value}`);
        }

    }

    /**
     * return deserialize from value
     * @param strValue 
     * @returns 
     */
    private _deserializeValue(strValue: string): any {
        let
            stringRegex = /^string:/,
            numberRegex = /^number:/,
            objectRegex = /^object:/,
            booleanRegex = /^boolean:/;

        if (stringRegex.test(strValue)) {
            return strValue.replace(stringRegex, '');
        }

        if (booleanRegex.test(strValue)) {
            let boolVal = strValue.replace(booleanRegex, '');
            return (boolVal === 'true');
        }

        if (numberRegex.test(strValue)) {
            let num = strValue.replace(numberRegex, '');
            return parseFloat(num);
        }

        if (objectRegex.test(strValue)) {
            let obj = strValue.replace(objectRegex, '');
            return JSON.parse(obj);
        }

        throw new Error(`Unable to deserialize stored cached value. Stored value: ${strValue}`);

    }


}




