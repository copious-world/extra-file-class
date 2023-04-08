const fs = require('fs')
const fsPromise = require('fs/promises')


console.log(typeof fs)
console.log(fs.constructor.name)
console.log(fsPromise.constructor.name)

console.log(Object.keys(fs))
console.log(Object.keys(fsPromise))


class MyObject {
    constructor() {
        Object.assign(this,fs)
    }
}



class MyObjectAsync {
    constructor() {
        Object.assign(this,fsPromise)
    }
}


let b = new MyObject()
let c = new MyObjectAsync()


b.writeFileSync("test-junk.txt","this is a test")

async function compute_me() {
    let text = await c.readFile("test-junk.txt")
    await c.rm("test-junk.txt")
    console.log(text.toString())
}


compute_me()
