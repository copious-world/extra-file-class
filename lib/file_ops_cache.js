
const FileOperations = require('./file_ops')

//
// FileOperationsCache provides a class with override capability that specializes methods in FileOperations to provide caching 
// with possible reading/writing having to do with cache hit missing.
//
// A default stopgap caching object is provided to act as the cache. But, a more robust verision this object may be 
// provided via configuration with the understanding that the provided object will implement the same interface 
// as the default object.
// 


const DEFAULT_SYNC_DELTA_TIME = 30000   // half a minute

// DefaultCacheTable -- default cache table behavior
//
class DefaultCacheTable {
    //
    constructor(name,is_file,conf) {
        this.table_name = name
        this.conf = conf
        this.is_file = is_file
        //
        this.table_list = {}
        this.failed_ops = []
        //
        this.object_root = false
        this.needs_backup = false
        this.ce_flags = {}
        this.data_is_structured = true
    }

    async init() {
        // initialization
    }

    all_files() {
        if ( this.is_file ) return false
        return Object.keys(this.table_list)
    }

    add_file(path) {
        if ( this.is_file ) return false
        this.table_list[path] = {} // make a place to put stuff like JSON maybe by key or maybe just write it
    }

    exists(path) {
        return (this.table_list[path] !== undefined)
    }

    data() {
        return this.object_root
    }

    set_data(data) {
        this.object_root = data
    }

    set_flags(ce_flags) {
        this.ce_flags = ce_flags
    }

    flags() {
        return this.ce_flags
    }

    mark_changed(val) {
        this.needs_backup = val ? true : false
    }
    
    needs_update() {
        return  this.needs_backup
    }

    is_structured() {
        return this.data_is_structured
    }

}


class FileOperationsCache extends FileOperations {

    constructor (conf) {
        super(conf)
        //
        this.conf = conf
        //
        this.CacheTable = DefaultCacheTable
        if ( this.conf && (this.conf.cache_table !== undefined) ) {
            if ( typeof this.conf.cache_table === 'string' ) {
                this.CacheTable = require(this.conf.cache_table)
            } else if ( typeof this.conf.cache_table === 'object' ) {
                this.CacheTable = this.conf.cache_table
            }
            // else revert to default
        }
        //
        this.configured_delta_time = (conf && conf.sync_delta) ? conf.sync_delta : DEFAULT_SYNC_DELTA_TIME
        //
        this.dir_caches = {}   /// top level path to object
        this.file_caches = {}
        //
        this._sync_timer = false
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
            if ( files_in_dir ) {
                for ( let file of files_in_dir ) {
                    delete this.file_caches[file]
                }
            }
            delete this.dir_caches[upath]    
        }
        return await super.dir_remover(upath,recursive,force)
    }



    // ensure_directories -- attempts to construct or verify all directories along the path up to an optional file
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file to be removed
    //                  top_dir -- an optional top level directy path under which directories will be created 
    //                  is_file_path -- optional -- true if the path is for a file (does not try to figure this out)

    async ensure_directories(path,top_dir,is_file_path) {
        let addinfile = (parent_path,file) => {
            let dir_obj = this.dir_caches[parent_path]
            if ( dir_obj ) {
                dir_obj.add_file(file)
            }
        }
        return super.ensure_directories(path,top_dir,is_file_path,addinfile)
    }


    // file_entry_maker -- create a directory --- create a matching cache path -- assume parent directory exists
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
    _file_remover_cache(path) {
        let file_o = this.file_caches[path]
        if ( file_o !== undefined ) {
            delete this.file_caches[path]
        }
    }

    async file_remover(path) {
        this._file_remover_cache(path)
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

    // write_out_string -- write string to file -- assume a valid path
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file that will contain the string
    //                  str -- a string to be written
    //                  ce_flags  -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
    //
    async write_out_string(path,str,ce_flags) {
        try {
            if ( !(path) ) return false
            let file_c = this.file_caches[path]
            if ( !file_c ) {
                this.file_entry_maker(path)
                file_c = this.file_caches[path]
            }
            file_c.set_data(obj)
            file_c.set_flags(ce_flags)
            file_c.set_structured(false)
            this.file_caches[path] = obj
            return await super.write_out_string(path,str,ce_flags)
        } catch (e) {
            this._file_remover_cache(path)         // maybe do a delayed attempt
            console.log(path)
            console.log(e)
            return false
        }

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
            file_c.set_flags(ce_flags)
            this.file_caches[path] = obj
            return await super.write_out_json(path,obj,ce_flags)
        } catch (e) {
            this._file_remover_cache(path)         // maybe do a delayed attempt
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
                    return file_c.data()
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



    // update_json_at_path -- make a file CacheTable as changed.
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file that will contain the string
    //
    update_at_path(path) {
        try {
            if ( !(path) ) return false
            let file_c = this.file_caches[path]
            if ( file_c ) {
                file_c.mark_changed(true)
                return true
            }
       } catch (e) {
            this._file_remover_cache(path)         // maybe do a delayed attempt
            console.log(path)
            console.log(e)
        }
        return false
    }


    // synch_files -- if a sync interval is set, then this will write out all files previously established by writing data.
    //
    //  -- parameter :: none
    //
    async synch_files() {
        for ( let file in this.file_caches ) {
            let c_table = this.file_caches[file]
            if ( c_table && c_table.needs_update() ) {
                let data = c_table.data()
                if ( data ) {
                    let flags = c_table.flags()
                    if ( (typeof data === "string") || !(c_tableis_structured()) ) {
                        await this.write_out_string(file,data,flags)
                    } else if ( (typeof data === "object") && c_tableis_structured() ) {
                        await this.write_out_json(file,data,flags)
                    }
                    file_c.mark_changed(false)
                }
            }
        }
    }


    async startup_sync(delta_time) {
        if ( delta_time === undefined ) {
            delta_time = this.configured_delta_time
        }
        if ( !delta_time ) {
            delta_time = DEFAULT_SYNC_DELTA_TIME
        }
        this._sync_timer = setInterval(() => {}, delta_time)
    }

    async stop_sync() {
        if ( typeof this._sync_timer === 'number' ) {
            clearInterval(this._sync_timer)
            this._sync_timer = false
        }
    }

}


module.exports = FileOperationsCache
