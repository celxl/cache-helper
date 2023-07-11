import { InMemoryCacheClass, getCacheInstance } from '../index';
const ttl = 5

describe('Class initialization - error handling', () => {
    it('Should throw error - wrong params cacheEnable type', () => {
        expect(() => {
            getCacheInstance({ cacheEnable: "asdf" as unknown as boolean, cacheTtl: 5 });
        })
            .toThrow("Type argument exception: options.cacheEnable parameter must be type boolean");
    });

    it('Should throw error - wrong params cacheTtl type', () => {
        expect(() => {
            getCacheInstance({ cacheEnable: true, cacheTtl: '5' as unknown as number });
        })
            .toThrow("Type argument exception: options.cacheTtl parameter must be type number");
    });

});

describe('Class initialization', () => {

    it('Should always return same object', () => {
        getCacheInstance({ cacheEnable: true, cacheTtl: ttl });

        const cache2 = getCacheInstance({ cacheEnable: true, cacheTtl: (ttl + 20) });

        expect(cache2.cacheTtl).toBe(ttl);
    });

});

describe('Cache usage', () => {
    let cache: InMemoryCacheClass;

    beforeAll(() => {
        cache = getCacheInstance();
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
            await new Promise(resolve => setTimeout(resolve, 500))
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
            await new Promise(resolve => setTimeout(resolve, 500))
            return 1
        });

        cache.set('test1.5', 5);
        const result = await cache.get('test1.5', () => {
            return callback();
        });

        expect(callback).not.toHaveBeenCalled();
        expect(result).toBe(5);
    });

    it('Should get stored keys', async () => {
        cache.clear();
        const output = ['hello', 'world', 'happy'];

        output.map(key => cache.set(key, 0));
        const result = cache.getKeys();

        expect(result).toEqual(output);
    });

    it('Should delete stored key-value', async () => {
        cache.clear();
        const
            input = ['hello', 'world', 'happy'],
            output = input.slice(1);

        input.map(key => cache.set(key, 0));
        cache.delete(input[0]);

        const
            cachedResult = null,
            result = cache.getKeys();

        expect(result).toEqual(output);
        expect(cachedResult).toBeNull();
    });

    it('Should be expired', async () => {
        const
            input = 5,
            output = null;

        cache.set('test', input);
        const time = cache.cacheTtl;

        await new Promise(resolve => setTimeout(resolve, time * 1000));

        const result = await cache.get('test');
        expect(output).toBe(result);
    }, (ttl + 5) * 1000);

});

describe('Class wrong usage', () => {
    let cache: InMemoryCacheClass;
    beforeAll(() => {
        cache = getCacheInstance()
    });

    it('Should should trow missing argument error - get', async () => {
        expect(async () => {
            await cache.get(undefined as unknown as string);
        }).rejects.toThrow('Missing argument exception: key parameter is mandatory');
    });

    it('Should should trow missing argument error - set', async () => {
        expect(() => {
            cache.set(undefined as unknown as string, 5);
        }).toThrow('Missing argument exception: key parameter is mandatory');
    });

    it('Should should trow missing argument error - set', async () => {
        expect(() => {
            cache.delete(undefined as unknown as string);
        }).toThrow('Missing argument exception: key parameter is mandatory');
    });


})