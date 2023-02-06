

const {FileOperations} = require('../index.js')
const node_path = require('path')


let fos = new FileOperations()

async function test() {
    let path = './tests/hum'
    let status = await fos.dir_maker(path)
    if ( status ) {
        console.log(`made dir ${path}`)
    } else {
        console.log('was it already there?')
    }

    status = await fos.exists(path)
    console.log(`the path ${path} exists: ${status}`)

    status = await fos.dir_remover('./tests/hum')

    if ( status ) {
        console.log('removed dir ./tests/hum')
    } else {
        console.log('was it already gone?')
    }

    status = await fos.exists(path)
    console.log(`the path ${path} exists: ${status}`)


    let new_file = "hum/tunes.json"
    let fpath = await fos.ensure_directories(new_file,"./tests",true,(parent_dr,filep) => {
        console.log(`may put a file ${filep} in ${parent_dr}`)
    })
    let str = "THIS IS A BIG TEST"
    await fos.write_out_string(fpath,str)

    await fos.write_append_string(fpath," MORE JUNK ON THE END")

    let stuff = await fos.load_data_at_path(fpath)

    console.log(stuff)

    await fos.file_remover(fpath)
    status = await fos.exists(fpath)
    console.log(`the file ${fpath} exists: ${status}`)

    // ----
    status = await fos.dir_remover('./tests/hum')

    if ( status ) {
        console.log('removed dir ./tests/hum')
    } else {
        console.log('was it already gone?')
    }

    status = await fos.exists(path)
    console.log(`the path ${path} exists: ${status}`)

    let json_to_write = {
        "hi" : "this is a",
        "field" : "in some",
        "json" : {
            "which" : "has",
            "fields" : true
        }
    }

    await fos.output_json(fpath,json_to_write)
    let was_output = await fos.load_json_data_at_path(fpath)

    console.log("this json that was written was:")
    console.dir(was_output)

    await fos.file_remover(fpath)
    let pdir = node_path.dirname(fpath)
    console.log(pdir)
    await fos.dir_remover(pdir,true)
}

test()