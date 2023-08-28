# Cache Helper Class

## Summary
Minimalistic cache tool to help with caching in nodejs applications. 

## Dependencies
 - node-cache: for memory cache support
 - redis: for redis cache support 
 - typescript

## Why caching?
Cache is used to improve performance within application taken data from memory instead other sources that are not as fast. Eg. consider an application that needs to use HTTP request to other application to fetch some data, with cache you won't need to make a new request every time data is needed, simply make the request the first time and store the data in cache.  
When using cache is important to keep that in mind:
 - Data you store in cache can change in realtime so is important to set cache expiration time according to your needs.
 - Is easy to forget your application is using cache which can lead unexpected results and tricky to debug.  

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
```
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
```
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

//function getting data
async getColorList() {
  // assume this do some db query to get list of colors
  return await db.findColors();
}

```
First notice the library use singleton pattern when caching the cache-keys are the same, so there is not much sense in making new objects every time that will be consuming extra memory.  
Second when initializing the cache class we can specify if want want the cache enable, the recommendation here is to have an environment variable specifying that so you can easily turn cache on/off in your app, which will be very handy when for debugging
Finally the get method accept a callback function that will do the normal [cache steps](#normally-when-using-cache-there-is-small-workflow-involve) for you, working even if the cache is disabled. Note the callback will only be executed when cache is enable and when the given key is not in use.  

## Usage
Install the library ```npm install cache-helper``` (library is not public in npm repo, at least not yet)  
The recommendation is to initialize the cache in one file withing your application and export it to avoid the need of setting every time.
```
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
Extra points:  
* At cache initialization you can define *keyPrefix* then every cache key you set/get will internally prefixed 
with value from *keyPrefix*. For memory cache not really important, but if you using redis you may want to set a key prefix to avoid conflict with other services that use same redis instance
* When using cache you don't really want an error in your caching mechanism to break your app, so cache helper makes sure specially with redis that any internal issues, eg. redis instance down, does not affect app workflow 

## Conclusions
Very simple way to handle cache with minimum dependencies, that should help you speed up your work.

  
