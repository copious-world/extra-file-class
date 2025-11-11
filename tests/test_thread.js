//

// "./extra-file-class.js"

importScripts("extra-file-class.js")

async function tests() {
    let web_fops = new FileOperationsWebSync ({})
    //
    console.log("this is a test")
    // all worker code here
    if ( web_fops ) {     
        await web_fops.wait_initialization()       
        let opts = {
            "locus" : "opfs"
        }
        await web_fops.dir_maker("cucumber/watermelon/orange",opts)
        await web_fops.outputJsonSync("other.json",{
            "check" : "maybe",
            "its" : "here",
            "then" : "maybe",
            "not" : true
        },opts)
        let data = await web_fops.readJsonSync("other.json",opts)
        console.log(data)
    }
}


tests()

