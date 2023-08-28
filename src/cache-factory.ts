import { CacheHelper, ICacheHelperOptions } from "./cache-helper";
import { InMemoryCache } from "./inmemory-cache";
import { RedisCache } from "./redis-cache";

var cacheInstance: any = null;



export async function getCacheInstance(options?: ICacheHelperOptions): Promise<CacheHelper> {
    if(!cacheInstance){
        switch (options?.type) {
            case 'in-memory':
                cacheInstance = new InMemoryCache(options);
                break;

            case "redis":
                cacheInstance = await RedisCache.build(options);
                break;
        
            default:
                throw new Error('Unrecognized type: '+ options?.type)
        }
        
    }
    return cacheInstance ;
}

export function DestroyCacheInstance() {cacheInstance = null}

