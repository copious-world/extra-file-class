

const path = require('path')

class DirectoryCache {
    
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
        const FOSClass = conf.use_caching ? require('./file_ops_cache') : require('./file_ops_cache')
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
        for ( let file of files ) {
            if ( path.extname(file) == ".json" ) {
                if ( this._noisy ) {
                    console.log(file)
                }
                //
                let fpath = `${dir_path}/${file}`
                let f_obj = await this.fos.load_json_data_at_path(fpath)
                try {
                    item_injector(f_obj)                    
                } catch (e) {
                    console.log("load_directory:: failed item injection")
                }
            } 
        }
        //
        if ( typeof after_action ==='function' ) {
            after_action()
        }
    }

    // -- backup_to_directory
    // --       save objects to the backup dir.
    //
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

    get_fos() {         // so that a module does not have to load more than one component
        return this.fos
    }


    stop() {
        if ( this._sync_interval ) {
            clearInterval(this._sync_interval)
            this.b_interval = null
        }
    }

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