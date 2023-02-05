
const FileOperations = require('./file_ops')
const path = require('path')

//
// FileOperationsCache provides a class with override capability that specializes methods in FileOperations to provide caching 
// with possible reading/writing having to do with cache hit missing.
//
// A default stopgap caching object is provided to act as the cache. But, a more robust verision this object may be 
// provided via configuration with the understanding that the provided object will implement the same interface 
// as the default object.
// 


let clonify = (obj) => { return JSON.parse(JSON.stringify(obj)) }

const DEFAULT_SYNC_DELTA_TIME = 30000   // half a minute

// DefaultCacheTable -- default cache table behavior
//
class DefaultCacheTable {
    //
    constructor(conf) {
        //
        this.dir_caches = {}   /// top level path to object
        this.file_caches = {}
        this.file_by_key = false  // only if keys are being used
        //
        this.conf = conf
        //
        this.failed_ops = []
        //
        this.needs_backup = false
    }

    async init() {
        // initialization
    }


    // ---- add_dir ---- ---- ---- ---- ---- ---- ----
    add_dir(path) {
        if (  this.dir_caches[path] === undefined ) {
            this.dir_caches[path] = {}
        }
    }


    remove_dir(upath,recursive,force) {
        let dir_o = this.dir_caches[upath]
        if ( dir_o !== undefined ) {
            let files_in_dir = Object.keys(dir_o)
            if ( files_in_dir ) {
                for ( let file of files_in_dir ) {
                    if ( this.dir_caches[file] ) {
                        if ( recursive ) {
                            this.remove_dir(file,recursive,force)
                        }
                    } else if ( force ) {
                        delete dir_o[file]
                        delete this.file_caches[file]
                    }
                }
            }
            if (Object.keys(dir_o).length === 0 ) {
                delete this.dir_caches[upath]    
            }
        }    
    }


    add_file_to_dir(parent_path,file) {
        let dir_o = this.dir_caches[parent_path]
        if ( dir_o ) {
            dir_o[file] = true
        }
    }

    add_file(path) {
        let parent_path = path.dirname(path)
        this.add_dir(parent_path)
        this.add_file_to_dir(parent_path,path)
        this.file_caches[path] = {
            "data" : false,
            "flags" : {},
            "is_structured" : false,
            "changed" : false,
            "key" : false,
            "path" : path
        }
    }

    contains(path) {
        if ( this.dir_caches[path] ) return true
        if ( this.file_caches[path] ) return true
        return false
    }

    contains_file(path) {
        let file_o = this.file_caches[path]
        if ( file_o ) {
            if ( file_o.key ) return file.key
            return true    
        }
        return false
    }


    file_data(path,fkey) { 
        let file_o = false
        if ( this.file_by_key !== false ) {
            file_o = this.file_by_key[fkey]
        } else {
            file_o = this.file_caches[path]
        }
        return file_o.data
    }

    set_file_data(path,obj,ce_flags,is_structured) {
        let file_o = this.file_caches[path]
        if ( file_o ) {
            file_o.data = obj
            file_o.flags = ce_flags
            file_o.is_structured = is_structured
            file_o.changed = true
        }
    }

    all_changed_files() {
        let cfiles = []
        for ( let file in this.file_caches ) {
            let file_o = this.file_caches[cfiles]
            if ( file_o.changed ) {
                cfiles.push(file_o)
            }
        }
        return cfiles
    }

    mark_changed(path,val) {
        let file_o = this.file_caches[path]
        if ( file_o ) {
            file_o.changed = val ? true : false
        }
    }

    clone_file(path_1,path_2) {
        let file_o = this.file_caches[path_1]
        this.add_file(path_2)
        let file_o_2 = this.file_caches[path_2]
        //
        file_o_2.flags = file_o.flags
        file_o_2.is_structured = file_o.is_structured
        file_o_2.changed = true
        file_o_2.data = clonify(file_o.data)
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
        this.cache_table = new this.CacheTable(conf)
        //
        this._sync_timer = false
        setImmediate(() => { this.init() })
    }

    async init() {
        await this.cache_table.init()
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
   
    // dir_maker -- create a directory --- create a matching cache path -- assume parent directory exists
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the directory to be created
    //
    async dir_maker(path) {
        await this.cache_table.add_dir(path)
        return await super.dir_maker(path)
    }

    // dir_remover -- remove a directory -- assume parent directory exists
    //           -- guards against THROW
    //  -- parameter :: upath -- a path to the directory to be removed
    //                  recursive -- from fsPromises 'rm' -- will remove subdirectories if true
    //                  force     -- from fsPromises 'rm' -- will remove directories and override stoppage conditions if true
    //
    async dir_remover(upath,recursive,force) {
        await this.cache_table.remove_dir(upath,recursive,force)
        return await super.dir_remover(upath,recursive,force)
    }



    // ensure_directories -- attempts to construct or verify all directories along the path up to an optional file
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file to be removed
    //                  top_dir -- an optional top level directy path under which directories will be created 
    //                  is_file_path -- optional -- true if the path is for a file (does not try to figure this out)

    async ensure_directories(path,top_dir,is_file_path) {
        let addinfile = (parent_path,file) => {   // the file is known to be bottom of the path
            this.cache_table.add_file_to_dir(parent_path,file)
        }
        return super.ensure_directories(path,top_dir,is_file_path,addinfile)
    }


    // _file_entry_maker -- create a directory --- create a matching cache path -- assume parent directory exists
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the directory to be created
    //
    async _file_entry_maker(path) {
        return this.cache_table.add_file(path)
    }


    // file_remover -- remove a file -- assume a valid path
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file to be removed
    //
    _file_remover_cache(path) {
        this.cache_table.remove_file(path)
    }

    async file_remover(path) {
        this.cache_table.remove_file(path)
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
            this._file_entry_maker(path_2)
            this.cache_table.clone_file(path_1,path_2)
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
            return this.cache_table.contains(path)
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
            let file_c = this.cache_table.contains_file(path)
            if ( !file_c ) {
                this._file_entry_maker(path)
            }
            let is_structured = false
            this.set_file_data(path,obj,ce_flags,is_structured)
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
            let file_c = this.cache_table.contains_file(path)
            if ( !file_c ) {
                this._file_entry_maker(path)
            }
            let is_structured = true
            this.set_file_data(path,obj,ce_flags,is_structured)
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
            let file_c = this.cache_table.contains_file(path)
            if ( file_c !== false) {
                return this.cache_table.file_data(path,file_c)
            } else {
                // treat this as a cache miss
                let data = await this.json_data_reader(path)
                if ( data ) {
                    this._file_entry_maker(path)
                    this.cache_table.set_file_data(path,data,{},true)
                    return data
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



    // update_json_at_path -- mark a file CacheTable as changed.
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file that will contain the string
    //
    update_at_path(path) {
        try {
            if ( !(path) ) return false
            if ( this.cache_table.contains_file(path) ) {
                this.cache_table.mark_changed(path,true)
                return true
            }
            return false
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
        for ( let file_info of this.cache_table.all_changed_files() ) {
            let flags = file_info.flags
            let data = file_info.data
            let file_name = file_info.path
            if ( (typeof data === "string") || !(file_info.structured) ) {
                await this.write_out_string(file_name,data,flags)
            } else if ( (typeof data === "object") && file_info.structured ) {
                await this.write_out_json(file_name,data,flags)
            }
            this.cache_table.mark_changed(path,false)
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
