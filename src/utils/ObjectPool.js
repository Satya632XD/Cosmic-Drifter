// src/utils/ObjectPool.js
export class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        for (let i=0; i<initialSize; i++) this.pool.push(this.createFn());
    }
    acquire() {
        return this.pool.length > 0 ? this.pool.pop() : this.createFn();
    }
    release(obj) {
        this.resetFn(obj);
        this.pool.push(obj);
    }
}
