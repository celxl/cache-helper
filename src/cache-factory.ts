import { CacheHelper, ICacheHelperOptions } from "./cache-helper";
import { InMemoryCache } from "./inmemory-cache";
import { RedisCache } from "./redis-cache";

var cacheInstanceMap: Map<string, CacheHelper> = new Map();



export async function getCacheInstance(options: ICacheHelperOptions): Promise<CacheHelper> {
    let 
        mapKey = `${options.type}-${options.cacheTtl}-${options.keyPrefix || ''}`,
        instance: CacheHelper = cacheInstanceMap.get(mapKey) as CacheHelper;

    if(!instance){
        switch (options?.type) {
            case 'in-memory':
                instance = new InMemoryCache(options);
                cacheInstanceMap.set(mapKey, instance);
                break;

            case "redis":
                instance = await RedisCache.build(options);;
                cacheInstanceMap.set(mapKey, instance);
                break;
        
            default:
                throw new Error('Unrecognized type: '+ options?.type)
        }
        
    }
    return instance ;
}

// export function DestroyCacheInstance() {cacheInstanceMap = null}

