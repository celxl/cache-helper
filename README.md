# Cache Helper Class

## Summary
Minimalistic cache tool to help with caching in nodejs applications. 

## Dependencies
 - node-cache: for memory cache support
 - redis: for redis cache support 
 - typescript

## Why caching?
Cache is used to improve performance within application taken data from memory or caching services like *Redis* instead other sources that are not as fast. Eg. consider an application that needs to use HTTP request to other application to fetch some data, with cache you won't need to make a new request every time data is needed, simply make the request the first time and store the data in cache.  
When using cache is important to keep that in mind:
 - Data you store in cache can change in realtime so is important to set cache expiration time according to your needs.
 - Is easy to forget your application is using cache which can lead unexpected results and tricky to debug.

## Features
 * In memory cache support
 * Redis cache support
 * Multiple instates efficiently supported.
   * Initialized instates with the exact same options will always return the exact same instate (reference to an existing instance already created).
   * Initialized instates with different options than an existing one will return new instance.
   * Initializing different *Redis* instance will return different instances, **but they still share the same redis connection**, avoiding multiple connections to same redis service. 
 * Framework agnostic     

## Why use this library?
**cache-helper** aims to simplify caching implementation in your application, with minimum setup this helper provides and easy way to manage caching, now since version 2.0.0 you can choose either memory or redis cache.
  
### Normally when using cache there is small workflow involve:
 1. Initialize your cache (and this can be inmemory but also with other tools like Redis) and define expiration time.
 2. Obtain data from cache.
 3. Check if the data exist.
    - If data is in cache we are done and continue whatever flow you app does.
    - If data is not in cache, then you need 2 more steps.
 4. Obtain data from real source, eg query to db.
 5. Store data in cache to be available for next time.  
Lets see a code example using node-cache
```TypeScript
//import cache library
import NodeCache from 'node-cache';

//initialize cache with expiration 60 seconds
const cache = new NodeCache({ stdTTL: 60 });

//function using cache
async myFunction() {
    let colorList = cache.get('color-list');
    if(!colorList) {
        colorList = await getColorList();
        cache.set('color-list', colorList);
    }
    // Now do other staff that use colorList for whatever reason
}

//function getting data
async getColorList() {
  // assume this do some db query to get list of colors
  return await db.findColors();
}

//the example is using promises to make it more realistic
```  

The goal of cache-helper library is to simplify those steps providing less verbose way to handle the caching and a ready to use class. So better than explain lets just see the same example.
``` typescript
//import
import { getCacheInstance } from 'cache-helper' ;

//initialize cache
const cache = await getCacheInstance({
    type: 'in-memory' // for memory cache
    cacheEnable: true, // making cache enable
    cacheTtl: 60 // expiration time for 60 seconds
  });

//function using cache
async myFunction() {
    let colorList = await cache.get('color-list',  async()=>{
        return await getColorList(); 
    });
    
    // Now do other staff that use colorList for whatever reason
}

// OR using generic types for TS
async myFunction() {
    let colorList: string[] = await cache.get<string[]>('color-list',  async()=>{
        return await getColorList(); 
    });
    
    // Now do other staff that use colorList for whatever reason
}

//function getting data
async getColorList() {
  // assume this do some db query to get list of colors
  return await db.findColors();
}



```
 

## Usage
Install the library ```npm install cache-helper``` (library is not public in npm repo, at least not yet)  
The recommendation is to initialize the cache in one file withing your application and export it to avoid the need of setting every time.
```TypeScript
//utils/cache.ts consider this file

//import
import {getCacheInstance} from 'cache-helper';


//initialization memory cache
export const cache = async () => {
  return await getCacheInstance({
    type: 'in-memory'
    cacheEnable: process.env['CACHE_ENABLE'] === 'yes',
    cacheTtl: process.env['CACHE_EXPIRATION']? parseInt(process.env['CACHE_EXPIRATION']) : 1
  });
}

//OR initialization redis cache
export const cache = async () => {
  return await getCacheInstance({ 
            cacheEnable: true,
            cacheTtl: ttl,
            type: 'redis',
            keyPrefix: "test", //optional but recommended when using redis
            redisOptions: {
                url: "redis://localhost:6379"
            } 
        });
  /*
  NOTE: redisOptions are the options of redis https://www.npmjs.com/package/redis
  */
}

// then in any other file where you need caching

//import from your initialization cache
import {cache} from './utils/cache';

// Now regardless if you are using redis or memory cache; usage is the same.  
// Just focus in your app and use caching for your needs without worrying in cache settings,  
// disconnecting events (in case of redis) or similar issues

//get cache
async function getColor() {
  return await cache.get('color');
}

//set some key
async function setColor(colors: string[]) {
  return await cache.set('color', colors);
}
//now you can cache

```

### Manage multiple cache instances
Lets assume an application that use data from DB meaning querying db to read that data, but it also needs data from external services that you get from http requests.
The DB data change very often out of users CRUD operations, however the external service data doesn't change that often. Now we want to improve performance and want to cache all data that is frequently accessed. We can use 1 *CacheHelper* instance for frequently changeable data with small TTL (expiration time) and a different instance for less changeable data with a bigger TTL (expiration time). Lets see an example.
```TypeScript
import { getCacheInstance } from 'cache-helper' ;

//initialize cache
const dbCache = await getCacheInstance({
    type: 'in-memory' // for memory cache
    cacheEnable: true, // making cache enable
    cacheTtl: 60 // expiration time for 60 seconds
});

const httpCache = await getCacheInstance({
    type: 'in-memory' // for memory cache
    cacheEnable: true, // making cache enable
    cacheTtl: 60 * 60 // expiration time for 1 hour
});
```
With the above code everything cached with *dbCache* will expire in 1m, while *httpCache* cached data expires in 1hr.  

### How multiple instates work
The ```getCacheInstance(options)``` function, decides to either create and return a new instance or simply return and existing one, base on the initialization in the following fields from the options parameters:  
* type
* cacheTtl
* keyPrefix
Getting a cache helper options say from 2 different places withing your application with the same values for those 3 options will always return the same instance. Internally a Map is created base on those 3 properties, returning the the item in the map that matches those values and if there is item in the map for them, then creates a new instance and add it to the map. 


Extra points:  
* At cache initialization you can define *keyPrefix* then every cache key you set/get will be internally prefixed 
with value from *keyPrefix*. For memory cache not really important, but if you using redis you may want to set a key prefix to avoid conflict with other services that use same redis instance
* When using cache you don't really want an error in your caching mechanism to break your app, so cache helper makes sure specially with redis that any internal issues, eg. redis instance down, does not affect app workflow 

## Conclusions
Very simple way to handle cache with minimum dependencies, that should help you speed up your work.

  
