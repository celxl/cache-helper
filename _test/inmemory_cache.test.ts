
import { CacheHelper, getCacheInstance } from '../index';
// import { DestroyCacheInstance } from '../src/cache-factory';
const ttl = 5

type MyType = {
    name: string;
}

describe('Class initialization - error handling', () => {
    it('Should throw error - wrong params cacheEnable type', () => {

       expect(async () => {
           return await getCacheInstance({ 
                cacheEnable: "asdf" as unknown as boolean, cacheTtl: 5, type: 'in-memory' })
            
        }).rejects.toThrow("Type argument exception: options.cacheEnable parameter must be type boolean");
    });

    it('Should throw error - wrong params cacheTtl type', () => {
        expect(async () => {
            return await getCacheInstance({ cacheEnable: true, cacheTtl: '5' as unknown as number, type: 'in-memory' });
        }).rejects.toThrow("Type argument exception: options.cacheTtl parameter must be type number");
    });

});

describe('Class initialization', () => {

    it('Should always return same object - same ttl, cache-type, prefix', async () => {
        await getCacheInstance({ cacheEnable: true, cacheTtl: ttl, type: 'in-memory' });

        const cache2 = await getCacheInstance({ cacheEnable: true, cacheTtl: ttl, type: 'in-memory' });
        
        expect(cache2.cacheTtl).toBe(ttl);
    });

    it('Should always diff instance - diff ttl, cache-type, prefix', async () => {
        await getCacheInstance({ cacheEnable: true, cacheTtl: ttl, type: 'in-memory' });

        const cache2 = await getCacheInstance({ cacheEnable: true, cacheTtl: (ttl + 20), type: 'in-memory' });

        expect(cache2.cacheTtl == (ttl + 20)).toBeTruthy();
    });

});

describe('Cache usage', () => {
    let cache: CacheHelper;

    beforeAll(async () => {
        cache = await getCacheInstance({
            cacheEnable: true,
            cacheTtl: ttl,
            type: "in-memory"
        });
    });

    it('Should store value in cache', async () => {
        const
            input = 5,
            output = 5;

        cache.set('test1.1', input);
        const result = await cache.get('test1.1');

        expect(result).toBe(output);
    });

    it('Should call callback', async () => {
        let a = 1;
        const callback = async (): Promise<MyType> => {
            // @ts-ignore
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve({name: 'hello'});
                }, 1000);
            });
        };

        const result = await cache.get<MyType>('test1.2', async () => {
            a ++;
            return await callback();
        });

        const result1 = await cache.get<MyType>('test1.2')

        expect(a).toBe(2);
        expect(result?.name).toBe('hello');
        expect(result1?.name).toBe('hello');

    });

    it('Should not execute callback', async () => {
        let a = 1;
        const callback = async (): Promise<MyType> => {
            // @ts-ignore
            return new Promise((resolve, reject) => {
                console.log('if you see me test is wrong')
                setTimeout(() => {
                    resolve({name: 'hello'});
                }, 1000);
            });
        };

        cache.set('test1.3', {name: 'hello'})
        const result = await cache.get('test1.3', async () => {
            a++;
            return await callback();
        });

        expect(a).toBe(1);
        expect(result?.name).toBe('hello');
    });

    it('Should execute/wait for promise', async () => {
        const callback = jest.fn(async () => {
            await new Promise(resolve => setTimeout(resolve, 1000))
            return 1
        });

        const result = await cache.get('test1.4', () => {
            return callback();
        });

        expect(callback).toHaveBeenCalled();
        expect(result).toBe(1);

    });

    it('Should not execute/wait for promise', async () => {
        const callback = jest.fn(async () => {
            await new Promise(resolve => setTimeout(resolve, 1000))
            return 1
        });

        cache.set('test1.5', 5);
        const result = await cache.get('test1.5', () => {
            return callback()
        });

        expect(callback).not.toHaveBeenCalled();
        expect(result).toBe(5);
    });

    it('Should throw callback error - promise', async () => {
        const callback = jest.fn(async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            throw new Error('Ups there is an error');
        });

        expect( async() => {
            await cache.get('test1.6', () => {
                return callback();
            });
        }).rejects.toThrow('Ups there is an error');

    });

    it('Should throw callback error - function', async () => {
        const callback = jest.fn( () => {
            throw new Error('Ups there is an error');
        });

        expect( async () => {
            await cache.get('test1.7', () => {
                return callback();
            });
        }).rejects.toThrow('Ups there is an error');

    });

    it('Should get stored keys', async () => {
        cache.clear();
        const output = ['hello', 'world', 'happy'];

        output.map(key => cache.set(key, 0));
        const result = await cache.getKeys();
        
        expect(result).toEqual(output);
    });

    it('Should delete stored key-value', async () => {
        cache.clear();
        const
            input = ['hello', 'world', 'happy'],
            output = input.slice(1);

        input.map(async (key) => await cache.set(key, 0));
        await cache.delete(input[0]);

        const
            cachedResult = null,
            result = await cache.getKeys();

        expect(result).toEqual(output);
        expect(cachedResult).toBeNull();
    });

    it('Should be expired', async () => {
        const
            input = 5,
            output = null;

        await cache.set('test', input);
        const time = cache.cacheTtl;


        await new Promise(resolve => setTimeout(resolve, time * 1000));

        const result = await cache.get('test');
        expect(result).toBe(output);
    }, (ttl + 5) * 1000);

});

describe('using key prefix', () => {
    let cache: CacheHelper;
    let cacheNoPrefix: CacheHelper;
    beforeAll(async() => {
        cache = await getCacheInstance({
            cacheEnable: true,
            cacheTtl: ttl,
            type: "in-memory",
            keyPrefix: 'test'
        });
        cacheNoPrefix = await getCacheInstance({
            cacheEnable: true,
            cacheTtl: ttl,
            type: "in-memory"
        });
    });

    it('Should should set the cache', async () => {
        await cache.set('key1', 'hello');
        const result = await cache.get<string>('key1');
        const result1 = await cacheNoPrefix.get<string>('key1');
        expect(result).toBe('hello');
        expect(result1).toBe(null);
    });

    it('Should call callback', async () => {
        let a = 1;
        const callback = async (): Promise<MyType> => {
            // @ts-ignore
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve({name: 'hello'});
                }, 1000);
            });
        };

        const result = await cache.get<MyType>('key2', async () => {
            a ++;
            return await callback();
        });

        const result1 = await cache.get<MyType>('key2');

        const result2 = await cacheNoPrefix.get<MyType>('key2');

        expect(a).toBe(2);
        expect(result?.name).toBe('hello');
        expect(result1?.name).toBe('hello');
        expect(result2).toBe(null);

    });
})