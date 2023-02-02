

const fsPromises = require('fs/promises')
const FileOperations = require('./file_ops')

//
// FileOperationsCache provides a class with override capability that specializes methods in FileOperations to provide caching 
// with possible reading/writing having to do with cache hit missing.
//
// A default stopgap caching object is provided to act as the cache. But, a more robust verision this object may be 
// provided via configuration with the understanding that the provided object will implement the same interface 
// as the default object.
// 

// CacheTable -- default cache table behavior
//
class CacheTable {
    //
    constructor(name,is_file,conf) {
        this.table_name = name
        this.conf = conf
        this.is_file = is_file
        //
        this.table_list = {}
        // 
        this.failed_ops = []
    }

    async init() {
        // initialization
    }

    all_files() {
        return Object.keys(this.table_list)
    }

    add_file(path) {
        this.table_list[path] = {} // make a place to put stuff like JSON maybe by key or maybe just write it
    }

    exists(path) {
        return (this.table_list[path] !== undefined)
    }


    data() {
        return {}
    }

    set_data(data) {
        // what this means
    }

}


class FileOperationsCache extends FileOperations {

    constructor (conf) {
        super(conf)
        //
        this.conf = conf
        //
        this.CacheTable = CacheTable
        if ( this.conf && (this.conf.cache_table !== undefined) ) {
            if ( typeof this.conf.cache_table === 'string' ) {
                this.CacheTable = require(this.conf.cache_table)
            } else if ( typeof this.conf.cache_table === 'object' ) {
                this.CacheTable = this.conf.cache_table
            }
            // else revert to default
        }
        //
        this.dir_caches = {}   /// top level path to object
        this.file_caches = {}
        //
        this._sync_queue = []
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
   
    // dir_maker -- create a directory --- create a matching cache path -- assume parent directory exists
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the directory to be created
    //
    async dir_maker(path) {
        if ( this.dir_caches[path] === undefined ) {
            this.dir_caches[path] = new this.CacheTable(path,false,this.conf)
        }
        return await super.dir_maker(path)
    }

    // dir_remover -- remove a directory -- assume parent directory exists
    //           -- guards against THROW
    //  -- parameter :: upath -- a path to the directory to be removed
    //                  recursive -- from fsPromises 'rm' -- will remove subdirectories if true
    //                  force     -- from fsPromises 'rm' -- will remove directories and override stoppage conditions if true
    //
    async dir_remover(upath,recursive,force) {
        let dir_o = this.dir_caches[upath]
        if ( dir_o !== undefined ) {
            let files_in_dir = dir_o.all_files()
            for ( let file of files_in_dir ) {
                delete this.file_caches[file]
            }
            delete this.dir_caches[upath]    
        }
        return await super.dir_remover(upath,recursive,force)
    }



    // file_maker -- create a directory --- create a matching cache path -- assume parent directory exists
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the directory to be created
    //
    async file_entry_maker(path) {
        if ( this.file_caches[path] === undefined ) {
            let entry = new this.CacheTable(path,true,this.conf)
            this.file_caches[path] = entry
            await entry.init()
            return true
        }
        return false
    }


    // file_remover -- remove a file -- assume a valid path
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file to be removed
    //
    async file_remover(path) {
        let file_o = this.file_caches[path]
        if ( file_o !== undefined ) {
            delete this.file_caches[path]
        }
        return await super.file_remover(path)
    }


    // file_copier -- copy a file from path_1 to path_2 -- assume valid paths
    //           -- guards against THROW
    //  -- parameter :: path_1 -- source path
    //                  path_2 -- destination path
    //

    async file_copier(path_1,path_2) {
        let have_file = await this.exists(path_1)
        if ( have_file ) {
            this.file_entry_maker(path_2)
            return await super.file_copier(path_1,path_2)
        }
        return false
    }

    // note: ensure diretory does will call this class dir_maker... it will make the table entries

    // exists -- wraps the access method -- assumes the path is a valid path
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file under test
    //                  
    async exists(path,app_flags) {
        let on_disk = this.exists(path,app_flags)
        if ( on_disk ) {
            if ( this.file_caches[path] ) return true
            if ( this.dir_caches[path] ) return true
        }
        return false
    }


    // write_out_json -- write string to file -- assume a valid path
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file that will contain the string
    //                  obj -- a JSON stringifiable object
    //                  ce_flags  -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
    //  -- returns false on failing either stringify or writing
    //
    async write_out_json(path,obj,ce_flags) {
        try {
            if ( !(path) ) return false
            let file_c = this.file_caches[path]
            if ( !file_c ) {
                this.file_entry_maker(path)
                file_c = this.file_caches[path]
            }
            file_c.set_data(obj)
            this.file_caches[path] = obj
            return await super.write_out_string(path,str,ce_flags)
        } catch (e) {
            this.file_remover(path)         // maybe do a delayed attempt
            console.log(path)
            console.log(e)
            return false
        }
    }


    // load_json_data_at_path -- read a JSON formatted file from disk
    //           -- guards against THROW
    //  -- parameter :: a_path -- a path to the file that contains the string to be read
    //             
    async load_json_data_at_path(path) {
        try {
            if ( !(path) ) return false
            let file_c = this.file_caches[path]
            if ( file_c ) {
                return file_c.data()
            } else {
                // treat this as a cache miss
                let data = await this.json_data_reader(path)
                if ( data ) {
                    this.file_entry_maker(path)
                    file_c = this.file_caches[path]
                    file_c.set_data(data)
                }
            }
        } catch (e) {
            console.log(">>-------------load_json_data read------------------------")
            console.log(e)
            console.dir(msg_obj)
            console.log("<<-------------------------------------")
        }
        return false
    }


    async startup_sync() {}

    async stop_sync() {}


}


module.exports = FileOperationsCache