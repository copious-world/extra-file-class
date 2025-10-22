
const FileOperations = require('./file_ops')
const node_path = require('path')


let clonify = (obj) => { return JSON.parse(JSON.stringify(obj)) }

const DEFAULT_SYNC_DELTA_TIME = 30000   // half a minute


/**
 * Class: DefaultCacheTable
 * 
 * -- default cache table behavior
 * -- abstract method framework
 * 
 * This is a default (stopgap) caching object, provided to act as the cache. But, a more robust verision of this object may be 
 * provided via configuration with the understanding that the provided object will implement the same interface
 * as the default object.
 * 
 */
class DefaultCacheTable {

    /**
     * DefaultCacheTable.constructor
     * 
     * Initializes global maps, one for files and one for directories.
     * All files and directories are found by path (or hash of path) in these global maps.
     * 
     * When directories are maintained, sub directories and files within the maintained directory
     * will be accessed by the directory object. The file will be found in the file cache and the 
     * directories will be found in the directory cache.
     * 
     * @param {object} conf 
     */
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

    /**
     * init
     * 
     * This method is included abstractly allowing for optional override in the descendants
     */
    async init() {
        // initialization
    }


    /**
     * add_dir
     * 
     * Includes a key for the path in the caching object and links the key to an empty object
     * 
     * @param {string} path 
     */
    add_dir(path) {
        if (  this.dir_caches[path] === undefined ) {
            this.dir_caches[path] = {}
        }
    }


    /**
     * remove_dir
     * 
     * removes the directory from the cache and removes
     * any cache based sub directories as well.
     * 
     * @param {string} upath 
     * @param {boolean} recursive 
     * @param {boolean} force 
     */
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


    /**
     * add_file_to_dir
     * 
     * Finds the dir cache object for the containing directory.
     * Adds to the map of the containing directory
     * 
     * @param {string} parent_path 
     * @param {string} file 
     */
    add_file_to_dir(parent_path,file) {
        let dir_o = this.dir_caches[parent_path]
        if ( dir_o ) {
            dir_o[file] = true  // detailed information will be in the global file cache
        }
    }

    /**
     * add_file
     * 
     * Adds a file as a new and empty object to caches and the containind directory.
     * 
     * @param {string} path 
     */
    add_file(path) {
        let parent_path = node_path.dirname(path)
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

    /**
     * remove_file
     * 
     * Deletes file data from the global file cache
     * 
     * @param {string} fpath 
     */
    remove_file(fpath) {
        if (  this.file_caches[fpath] ) {      
            delete this.file_caches[fpath]
        }
    }

    /**
     * contains
     * 
     * check to see if the path is maintained anywhere as a file or a directory 
     * by checking the global file and directory caches
     * 
     * @param {string} path 
     * @returns boolean
     */
    contains(path) {
        if ( this.dir_caches[path] ) return true
        if ( this.file_caches[path] ) return true
        return false
    }

    /**
     * contains_file
     * 
     * returns false is not in the global file cache. 
     * for present files returns true or (if a file has a hash key) as string
     * 
     * @param {string} path 
     * @returns string | boolean
     */
    contains_file(path) {
        let file_o = this.file_caches[path]
        if ( file_o ) {
            if ( file_o.key ) return file.key
            return true    
        }
        return false
    }


    /**
     * file_data
     * 
     * Search file caches and possibly key maps for the file object.
     * The reference to the file data will be in the "data" field of the object if found.
     * 
     * @param {string} path 
     * @param {string} fkey (optional)
     * @returns buffer | string
     */
    file_data(path,fkey) { 
        let file_o = false
        if ( this.file_by_key !== false ) {
            file_o = this.file_by_key[fkey]
        } else {
            file_o = this.file_caches[path]
        }
        return file_o.data
    }

    /**
     * set_file_data
     * 
     * When writing the file, the data will be captured in the file object 
     * and when read it will be pulled from the `data` field of the file object.
     * 
     * When the data is set, the file is marked as changed.
     * 
     * @param {string} path 
     * @param {object} obj 
     * @param {number} ce_flags 
     * @param {boolean} is_structured 
     * 
     */
    set_file_data(path,obj,ce_flags,is_structured) {
        let file_o = this.file_caches[path]
        if ( file_o ) {
            file_o.data = obj
            file_o.flags = ce_flags
            file_o.is_structured = is_structured
            file_o.changed = true
        }
    }

    /**
     * all_changed_files
     * 
     * Extract the list of file objects that have been changed from the file cache.
     * 
     * @returns array
     */
    all_changed_files() {
        let cfiles = []
        for ( let file in this.file_caches ) {
            let file_o = this.file_caches[file]
            if ( file_o.changed ) {
                cfiles.push(file_o)
            }
        }
        return cfiles
    }

    /**
     * mark_changed
     * 
     * Aking to `touch`. The file will be marked as changed even if no other operation has been performed on it. 
     * 
     * @param {string} path 
     * @param {object} val 
     */
    mark_changed(path,val) {
        let file_o = this.file_caches[path]
        if ( file_o ) {
            file_o.changed = val ? true : false
        }
    }

    /**
     * clone_file
     * 
     * With the understanding that a file contains some JavScript object that can be 
     * handles as JSON, this method obtains the data object from the file cache and
     * stored a clone of the object under a new path, `path_2`. 
     * 
     * @param {string} path_1 
     * @param {string} path_2 
     */
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


/**
 * 
 * class:  FileOperationsCache extends FileOperations
 * 
 * provides a class with override capability that specializes methods in FileOperations to provide caching 
 * with possible reading/writing having to do with cache hits.
 * 
 * 
 * Fields of Conf:
 * * cache_table
 * * sync_delta
 * 
 */

class FileOperationsCache extends FileOperations {

    /**
     * FileOperationsCache.constructor
     * 
     * 
     * @param {object} conf 
     */
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
   
    /**
     * dir_maker
     * 
     * -- create a directory --- create a matching cache path -- assume parent directory exists
     * 
     * @param {string} path -- a path to the directory to be created
     * 
     * @returns boolean
     */
    async dir_maker(path) {
        await this.cache_table.add_dir(path)
        return await super.dir_maker(path)
    }


    /**
     * dir_remover
     * -- remove a directory -- assume parent directory exists
     * -- guards against THROW
     * 
     * @param {string} upath -- a path to the directory to be removed
     * @param {boolean} recursive -- from fsPromises 'rm' -- will remove subdirectories if true
     * @param {boolean} force -- from fsPromises 'rm' -- will remove directories and override stoppage conditions if tru
     * 
     * @returns boolean
     */
    async dir_remover(upath,recursive,force) {
        await this.cache_table.remove_dir(upath,recursive,force)
        return await super.dir_remover(upath,recursive,force)
    }


    /**
     * ensure_directories
     * 
     * -- attempts to construct or verify all directories along the path up to an optional file
     * -- guards against THROW
     * 
     * @param {string} path -- a path to the file to be removed
     * @param {string} top_dir -- an optional top level directy path under which directories will be created 
     * @param {boolean} is_file_path -- optional -- true if the path is for a file (does not try to figure this out)
     * @returns string | boolean
     */
    async ensure_directories(path,top_dir,is_file_path) {
        let addinfile = (parent_path,file) => {   // the file is known to be bottom of the path
            this.cache_table.add_file_to_dir(parent_path,file)
        }
        return super.ensure_directories(path,top_dir,is_file_path,addinfile)
    }


    /**
     * _file_entry_maker
     * 
     * -- create a directory --- create a matching cache path -- assume parent directory exists
     * -- guards against THROW
     * 
     * @param {string} path -- a path to the directory to be created
     */
    async _file_entry_maker(path) {
        this.cache_table.add_file(path)
    }

    /**
     * _file_remover_cache
     * -- remove a file -- assume a valid path
     * -- guards against THROW
     * 
     * @param {string} path -- a path to the file to be removed
     */
    _file_remover_cache(path) {
        this.cache_table.remove_file(path)
    }

    /**
     * file_remover
     * 
     * @param {string} path 
     * @returns boolean
     */
    async file_remover(path) {
        this.cache_table.remove_file(path)
        return await super.file_remover(path)
    }

    /**
     * file_copier
     * 
     * -- copy a file from path_1 to path_2 -- assume valid paths
     * -- guards against THROW
     * 
     * 
     * @param {string} path_1 -- source path
     * @param {string} path_2 -- destination path
     * @returns boolean
     */
    async file_copier(path_1,path_2) {
        let have_file = await this.exists(path_1)
        if ( have_file ) {
            this._file_entry_maker(path_2)
            this.cache_table.clone_file(path_1,path_2)
            return await super.file_copier(path_1,path_2)
        }
        return false
    }

    // note: ensure diretory does call this class's dir_maker... it will make the table entries

    
    /**
     * exists
     * 
     * returns true if the file being checked is both and disk and in the cache.
     * 
     * -- wraps the access method -- assumes the path is a valid path
     * -- guards against THROW
     * 
     * @param {string} path -- a path to the file under test
     * @param {number} app_flags 
     * @returns boolean
     */             
    async exists(path,app_flags) {
        let on_disk = await super.exists(path,app_flags)
        if ( on_disk ) {
            return this.cache_table.contains(path)
        }
        return false
    }


    /**
     * write_out_string
     * 
     * -- write string to file -- assume a valid path
     * -- guards against THROW
     * 
     * 
     * @param {string} path -- a path to the file that will contain the string
     * @param {string} str -- a string to be written
     * @param {number} ce_flags -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
     * @returns boolean
     */
    async write_out_string(path,str,ce_flags) {
        try {
            if ( !(path) ) return false
            let file_c = this.cache_table.contains_file(path)
            if ( !file_c ) {
                this._file_entry_maker(path)
            }
            let is_structured = false
            this.cache_table.set_file_data(path,str,ce_flags,is_structured)
            return await super.write_out_string(path,str,ce_flags)
        } catch (e) {
            this._file_remover_cache(path)         // maybe do a delayed attempt
            console.log(path)
            console.log(e)
            return false
        }

    }

    /**
     * write_out_json
     * 
     * -- write string to file -- assume a valid path
     * -- guards against THROW
     * 
     * 
     * @param {string} path -- a path to the file that will contain the string
     * @param {object} obj -- a JSON stringifiable object
     * @param {number} ce_flags -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
     * @returns boolean -- false on failing either stringify or writing
     */
    async write_out_json(path,obj,ce_flags) {
        try {
            if ( !(path) ) return false
            let file_c = this.cache_table.contains_file(path)
            if ( !file_c ) {
                this._file_entry_maker(path)
            }
            let is_structured = true
            this.cache_table.set_file_data(path,obj,ce_flags,is_structured)
            let str = JSON.stringify(obj)
            return await super.write_out_string(path,str,ce_flags)
        } catch (e) {
            this._file_remover_cache(path)         // maybe do a delayed attempt
            console.log(path)
            console.log(e)
            return false
        }
    }
  
    /**
     * load_json_data_at_path
     * 
     * -- read a JSON formatted file from disk
     * -- guards against THROW
     * 
     * @param {string} path -- a path to the file that contains the string to be read
     * @returns string | buffer | boolean
     */        
    async load_json_data_at_path(path) {
        try {
            if ( !(path) ) return false
            let file_c = this.cache_table.contains_file(path)
            if ( file_c !== false) {
                let data = this.cache_table.file_data(path,file_c)
                return data
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
            console.log("<<-------------------------------------")
        }
        return false
    }


    /**
     * update_at_path
     * 
     * -- mark a file CacheTable as changed.
     * -- guards against THROW
     * 
     * @param {string} path -- a path to the file that will contain the string
     * @returns boolean
     */
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


    /**
     * synch_files
     * 
     * -- if a sync interval is set, then this will write out all files previously established by writing data.
     * 
     */
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


    /**
     * startup_sync
     * 
     * @param {timestamp} delta_time 
     */
    async startup_sync(delta_time) {
        if ( delta_time === undefined ) {
            delta_time = this.configured_delta_time
        }
        if ( !delta_time ) {
            delta_time = DEFAULT_SYNC_DELTA_TIME
        }
        this._sync_timer = setInterval(() => { this.synch_files() }, delta_time)
    }

    /**
     * stop_sync
     */
    async stop_sync() {
        if ( typeof this._sync_timer === 'number' ) {
            clearInterval(this._sync_timer)
            this._sync_timer = false
        }
    }

}


module.exports = FileOperationsCache
