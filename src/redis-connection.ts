import { createClient, RedisClientOptions, RedisClientType, RedisModules } from 'redis';

var connectionInstance: RedisClientType = null as unknown as RedisClientType;

export default function geRedisConnection (options: RedisClientOptions<RedisModules, Record<string, never>, Record<string, never>> | undefined): RedisClientType {
    if(!connectionInstance) {
        connectionInstance = createClient(options);
    }
    return connectionInstance;
}