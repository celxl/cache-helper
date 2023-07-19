# Cache Helper Class

## Summary
Minimalistic cache tool to help with caching in nodejs applications. 

## Dependencies
 - node-cache: in memory cache library
 - typescript

## Why caching?
Cache is used to improve performance within application taken data from memory instead other sources that are not as fast. Eg. consider an application that needs to use HTTP request to other application to fetch some data, with cache you won't need to make a new request every time data is needed, simply make the request the first time and store the data in cache.  
When using cache is important to keep that in mind:
 - Data you store in cache can change in realtime so is important to set cache expiration time according to your needs.
 - Is easy to forget your application is using cache which can lead unexpected results and tricky to debug.  

## Why use this library?
node-cache provides several of utilities to handle caching in your application: **get data from cache**, **store data in cache**, **remove partial data from cache** and **clear cache** among the most relevant and the ones we mostly use, using a cache-key to access a particular peace of data.  
Eg. 
```
//store data in cache
cache.set('color-list', ['red', 'blue', 'black']);
//get data from cache
var colors = cache.get('color-list');

//now the variable colors has the array previously stored in the cache
```  
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

The goal of InMemoryCache library is to simplify those steps providing less verbose way to handle the caching and a ready to use class. So better than explain lets just see the same example.
```
//import InMemoryCache
import { getCacheInstance } from 'inmemory-cache' ;

//initialize cache
const cache = getCacheInstance({
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
Install the library ```npm install inmemory-cache``` (library is not public in npm repo, at least not yet)  
The recommendation is to initialize the cache in your application entry file eg. in server.ts of an express app, or the main.ts of a nestjs app.
```
//This is your app entry file

//import
import {getCacheInstance} from 'inmemory-cache';

//initialization
getCacheInstance({
    cacheEnable: process.env['CACHE_ENABLE'] === 'yes',
    cacheTtl: process.env['CACHE_EXPIRATION']? parseInt(process.env['CACHE_EXPIRATION']) : 1
  });

// then in any other file where you need caching

//import
import {getCacheInstance} from 'inmemory-cache';

//get the cache instance
const cache = getCacheInstance(); note how not specifying parameters, since instance was created in entry file

//now you can cache

```

## Comming soon
Add reddis, so the class can be configuralbe to either in-memory or redis cache
## Conclusions
Very simple way to handle cache with minimum dependencies, that should help you speed up your work.

  
