const fs = require('fs')
const fsPromise = require('fs/promises')


const {FileOperations} = require('../index.js')

let conf = false
let fos = new FileOperations(conf)

//

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



async function useit() {
    let obj = {
        "gnarly" : "json",
        "thing" : "you want on disk"
    }
    await fos.writeFile('./junk-to-test',JSON.stringify(obj))
    let obj2 = JSON.parse(fos.fs.readFileSync('./junk-to-test').toString())
    console.dir(obj2)
    await fos.rm('./junk-to-test')
}



async function compute_me() {
    let text = await c.readFile("test-junk.txt")
    await c.rm("test-junk.txt")
    console.log(text.toString())

    useit()
}




compute_me()

