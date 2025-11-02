

const path = require('path')


/**
 * The aim of this class is to take care of loading files from a directory
 *  and backing them up at intervals.
 * 
 * DirectoryCache class provides two methods to send objects to files
 * in a directory and to load them again later. It may also provide interval based synching.
 * 
 * This class has an option to use or not use the caching version of the file system operations.
 * 
 * This class will start the backup process if the backup interval and the directory have been specified.
 * 
 * This class does not call the `load_directory` method upon construction. 
 * The application must call it. In particular, it must call the class `load_directory`
 * method with an item injector, a function that puts elements into the object list
 * provided in the configuration. This class does not operate on the list directly,
 * it calls the injector.
 * 
 * The **constructor** takes a configuration object which defines defaults required for operation.  
 * The following are the fields that should be in the configuration object:
 * 
 * Fields of Conf:
 * 
 * * default_directory -- a top level directory use when parameters do mention it
 * * noisy              -- whether to print log messages or not
 * * crash_cant_load    -- turns off reloading after a crash
 * * file_namer         -- a function that names files on behalf of the application per object stored
 * * object_list        -- reference to a list that another part of an application will grow and shrink; 
 *                          This class just writes the objects to disk.
 * * use_caching        -- off by default. If on, then the caching version of the file operation is used
 * * backup_interval    -- time to wait between backups in miliseconds
 * 
 */
class DirectoryCache {
    
    /**
     * DirectoryCache.constructor
     * 
     * The constructor has just one parameter. See "Fields of Conf".
     * 
     * @param {object} conf 
     */
    constructor(conf) {
        if ( conf === undefined ) throw new Error("DirectoryCache: no configuration")
        this._dir = conf.default_directory
        this._noisy = conf.noisy
        this._crash_cant_load = conf.crash_cant_load
        this._file_namer = (typeof conf.file_namer === 'string') ? require(conf.file_namer) : conf.file_namer // should be a function
        if ( typeof this._file_namer !== 'function' ) {
            throw new Error("DirectoryCache ... constructor, configured file name is not a function ")
        }
        this._iterable_from_conf = conf.object_list ? conf.object_list : false
        //
        const FOSClass = conf.use_caching ? require('./file_ops_cache') : require('./file_ops')
        this.fos = new FOSClass(conf)
        //
        this.conf = conf
        if ( conf ) {
            if ( conf.backup_interval && (this._dir) ) {
                let b_interval = parseInt(conf.backup_interval)
                this.start(b_interval)
            }
        }
    }


    /**
     * load_directory
     * 
     * Locates a directory and then loads all of its files, 
     * expecting them to contain JSON objects. Calls on JSON parsing.
     * 
     * The directory consists of a number of files each containing one JSON object.
     * The most likely case will be that the objects are fairly large. Or, there will be many small
     * files. It is possible that the item injector takes an array of objects as well. 
     * 
     * The `base_dir` is the directory (abolute or relative to the application cwd).
     * This method can override the `base_dir` set in the configuration. Otherwise, it can be left
     * empty or string 'default' can be passed, where this method reserves the string 'default' to 
     * select the configured `base_dir`.
     * 
     * `after_action` is some code supplied by the application and is optional.
     * It can take in an array of errors if the application wants to process errors
     * that may occur in loading files. Otherwise, no information is passed on to the method.
     * 
     * 
     * @param {string} dpath -- a path relative to the base directory, which will be below the default directory
     * @param {function} item_injector -  a one parameter function, where the parameter should be a parsed JSON object from one of the files.
     * @param {string} base_dir -- if specified, this base dir can override the configured one or be set to use it.
     * @param {function} after_action -- a call back for after loading.
     */

    async load_directory(dpath,item_injector,base_dir,after_action) {
        if ( base_dir === 'default' || (base_dir === undefined) ) base_dir = this._dir
        if ( typeof item_injector !== 'function' ) throw new Error("load_directory: item_injector is no a function")
        let dir_path = ''
        if ( base_dir ) {
            dir_path = `${base_dir}/${dpath}`
        }
        //
        let files = await this.fos.dir_reader(dir_path)
        //
        let errs = []
        for ( let file of files ) {
            if ( path.extname(file) == ".json" ) {
                if ( this._noisy ) {
                    console.log(file)
                }
                //
                let fpath = `${dir_path}/${file}`
                let f_obj = await this.fos.load_json_data_at_path(fpath)
                try {
                    item_injector(f_obj)             // ITEM INJECTO       
                } catch (e) {
                    errs.push(e)
                    console.log("load_directory:: failed item injection")
                }
            } 
        }
        //
        if ( typeof after_action ==='function' ) {
            after_action(errs)
        }
    }

    
    /**
     * backup_to_directory
     * 
     * Write a list of objects to files, named by the file namer function, 
     * configured. All files are written to the base directory if specified or to the default base directory, configured.
     * 
     * The applicaetion may call this method directly, or the application may configure
     * the interval function, which calls this method.
     * 
     * @param {function} file_namer -- a one parameter function, given an object, this method should return a string for a file name
     * @param {string} base_dir -- (optinal) -- if specified, this base dir can override the configured one or be set to use it.
     * @param {Iterable} list -- list is an iterable that provides access to writable objects, If not specified, this method attempts to use the configured iterable.
     * @param {number} ce_flags -- see node.js file system documentation for flags to use in writing to a file.
     */
    async backup_to_directory(file_namer,base_dir,list,ce_flags) {
        if ( !(base_dir) ) base_dir = this._dir
        if ( typeof file_namer !== 'function' ) throw new Error(`backup_to_directory: file_name is not a function`)
        let all_file_p = []
        if ( list === undefined ) {
            list = this._iterable_from_conf
        }
        if ( list ) {
            for ( let datum of list ) {
                let fname = file_namer(datum)
                let path = `${base_dir}/${fname}.json`
                let p = this.fos.write_out_json(path,datum,ce_flags)
                all_file_p.push(p)
            }
            await Promise.all(all_file_p)    
        }
    }

    /**
     * get_fos
     * 
     * Return the reference to the file operations object that this DirectoryCache object is using.
     * 
     * @returns object -- the file operation object this directory cache is using
     */
    get_fos() {         // so that a module does not have to load more than one component
        return this.fos
    }


    /**
     * stop
     * 
     * Turn off the backup interval.
     * 
    */
    stop() {
        if ( this._sync_interval ) {
            clearInterval(this._sync_interval)
            this._sync_interval = null
        }
    }

    /**
     * start
     * 
     * Turn on the backup interval with delta time passed to it.
     * 
     * Calls setInterval with a thunk wrapping `backup_to_directory`
     * 
     * @param {number} b_interval -- integer required for setInterval (**b**ackup interval) The delta time between calls to **backup_to_directory**
     */
    start(b_interval) {
        if ( this._sync_interval ) {
            this.stop()
        }
        this._sync_interval = setInterval(() => {
            this.backup_to_directory(this._file_namer,this._dir)
        },b_interval)
    }

}




module.exports = DirectoryCache