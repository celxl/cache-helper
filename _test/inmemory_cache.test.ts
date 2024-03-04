import { CacheHelper, getCacheInstance } from '../index';
// import { DestroyCacheInstance } from '../src/cache-factory';
const ttl = 5

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

    it('Should execute callback', async () => {
        const callback = jest.fn(() => { return 1 });

        const result = await cache.get('test1.2', () => {
            return callback();
        });

        expect(callback).toHaveBeenCalled();
        expect(result).toBe(1);

    });

    it('Should not execute callback', async () => {
        const callback = jest.fn(() => { return 1 });

        cache.set('test1.3', 5);
        const result = await cache.get('test1.3', () => {
            return callback();
        });

        expect(callback).not.toHaveBeenCalled();
        expect(result).toBe(5);
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
            return callback();
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

describe('Class wrong usage', () => {
    // let cache: CacheHelper;
    // beforeAll(async() => {
    //     cache = await getCacheInstance({cacheEnable: true,
     //       cacheTtl: ttl}{
    //         cacheEnable: true,
    //         cacheTtl: ttl,
    //         type: "in-memory"
    //     });
    // });

    // it('Should should trow missing argument error - get', async () => {

    //     await expect( cache.get(undefined as unknown as string) )
    //         .toThrow('Missing argument exception: key parameter is mandatory');
    // });

    // it('Should should trow missing argument error - set', async () => {
    //     expect(async () => {
    //         await cache.set(undefined as unknown as string, 5);
    //     }).rejects.toThrow('Missing argument exception: key parameter is mandatory');
    // });

    // it('Should should trow missing argument error - set', async () => {
    //     expect(async () => {
    //          await cache.delete(undefined as unknown as string);
    //     }).rejects.toThrow('Missing argument exception: key parameter is mandatory');
    // });


})