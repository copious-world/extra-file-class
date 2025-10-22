


let PathManager = require('../lib/path_extension')




async function test() {
    console.log("TEST : >> path_extension")

    let conf = {
        "path_abreviations" : {
            "[websites]" : "[alphas]/websites",
            "[alphas]" : "[github]/alphas",
            "[alpha-copious]" : "[github]/alphas/alpha-copious",
            "[github]" : "~/Documents/GitHub",
            "[locals]" : "./stuff/[friends]",
            "[sibling]" : "../something",
            "[aunt]" : "../../${aunt}",
            "[uncle]" : "../../${uncle}",
            "[redef]" : "/home/buddies/",
            "[tricky]" : "[redef]/[aunt]/specials"
        },
        "vars" : {
            "${aunt}" : "tia maria",
            "${uncle}" : "tio bolo"
        }
    }

    let pm = new PathManager(conf)

    console.log(pm.default_realtive_asset_dir())

    console.dir(pm.path_abreviations())

}




test()