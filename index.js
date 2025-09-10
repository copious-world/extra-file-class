//  extra-file-class
// 
let FileOperations = require('./lib/file_ops')
let FileOperationsCache = require('./lib/file_ops_cache')
let DirectoryCache = require('./lib/directory_caches')
let PathManager = require('./lib/path_extension')


module.exports = (as_dropin,conf) => {
    if ( (as_dropin === "dropin") || ( as_dropin === undefined) ) {
        return new FileOperations(conf)
    } else if ( as_dropin === "cache" ) {
        return new FileOperationsCache(conf)
    } else {
        const fs_promises = require('fs/promises')
        return fs_promises
    }
}

module.exports.FileOperations = FileOperations
module.exports.FileOperationsCache = FileOperationsCache
module.exports.DirectoryCache = DirectoryCache
module.exports.PathManager = PathManager
