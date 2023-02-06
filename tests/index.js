let wins = 0

const {spawn} = require('child_process')


async function do_everything() {

    let p = new Promise((resovle,reject) => {
        let tst = spawn('node',['./tests/base_test.js'])
    
        tst.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
        
        tst.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
        
        tst.on('close', (code) => {
            resovle(true)
            console.log(`child process exited with code ${code}`);
        });
    })
    
    
    let do_next = await p
    
    if ( do_next ) {
        wins++
    }
    
    new Promise((resovle,reject) => {

        let tst2 = spawn('node',['./tests/caches_test.js'])
        
        tst2.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
        
        tst2.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
        
        tst2.on('close', (code) => {
            resovle(true)
            console.log(`child process exited with code ${code}`);
        });
    })
    
    console.log("wins: " + wins)

}


do_everything()
