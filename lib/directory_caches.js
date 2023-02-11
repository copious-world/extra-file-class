

const path = require('path')

class DirectoryCache {
    
    constructor(conf) {
        this._dir = conf.default_firectory
        this._noisy = conf.noisy
        this._crash_cant_load = conf.crash_cant_load
        //
        const FOSClass = conf.use_caching ? require('./file_ops_cache') : require('./file_ops_cache')
        this.fos = new FOSClass(conf)
        //
        this.conf = conf
        if ( conf ) {
            if ( conf.backup_interval && (this._dir) ) {
                let b_interval = parseInt(conf.backup_interval)
                setInterval(() => {
                    this.backup_to_directory()
                },b_interval)
            }
        }
    }


    async load_directory(dpath,base_dir,item_injector,after_action) {
        if ( base_dir === 'default' ) base_dir = this._dir
        if ( typeof item_injector !== 'function' ) throw new Error("load_directory: item_injector is no a function")
        let dir_path = ''
        if ( base_dir ) {
            dir_path = `${base_dir}/${dpath}`
        }

        let files = await this.fos.dir_reader(dir_path)

        for ( let file of files ) {
            if ( path.extname(file) == ".json" ) {
                if ( this._noisy ) {
                    console.log(file)
                }
                //
                let fpath = `${dir_path}/${file}`
                let f_obj = await this.fos.load_json_data_at_path(fpath)
                item_injector(f_obj)
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
    async backup_to_directory(base_dir,file_namer,list,ce_flags) {
        if ( !(base_dir) ) base_dir = this._dir
        if ( typeof file_namer !== 'function' ) throw new Error(`backup_to_directory: file_name is not a function`)
        let all_file_p = []
        for ( let datum of list ) {
            let fname = file_namer(datum)
            let path = `${base_dir}/${fname}.json`
            let p = this.fos.write_out_json(path,datum,ce_flags)
            all_file_p.push(p)
        }
        await Promise.all(all_file_p)
    }

    get_fos() {         // so that a module does not have to load more than one component
        return this.fos
    }
}




module.exports = DirectoryCache