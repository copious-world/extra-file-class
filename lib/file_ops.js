
const fsPromises = require('fs/promises')
const fs = require('fs')
const path = require('path')


/**
 * FileOperations
 * 
 * 
 * FileOperations provides a class with override capability that wraps standard node.js 
 * file calls from fs/Promises.
 * 
 * Includes the capability of an endpoint server. Provides a bridge of inclusion for
 * application calls for an enpoint that uses file operations.
 * 
 * Most wrappers catch fs/Promises exceptions except where noted.
 * Methods return false if data cannot be obtained.
 * 
 * 
 * Fields of Conf:
 * 
 * * EMFILE_handler
 *      * A class instance expected to have a method **defer**
 * 
 */
class FileOperations {

    /**
     * constructor
     * 
     * 
     * @param {object} conf 
     */
    constructor (conf) {
        //
        this.EMFILE_handler = false
        if ( typeof conf === 'object' ) {
            if ( conf.EMFILE_handler ) {
                if ( typeof conf.EMFILE_handler === 'string' ) {
                    this.EMFILE_handler = require(conf.EMFILE_handler)
                } else if ( typeof conf.EMFILE_handler === 'function' ) {
                    this.EMFILE_handler = conf.EMFILE_handler
                }
            }    
        }
        //
        Object.assign(this,fsPromises)
        this.fs = fs
        //
    }



    /**
     * different_drive
     * 
     * Uses the file system stat methods to determine if the files are on different drives
     * 
     * @param {string} src 
     * @param {string} dest 
     */
    async different_drive(src,dest) {
        try {
            const stats1 = await fsPromises.stat(src);
            const stats2 = await fsPromises.stat(dest);
            return stats1.dev !== stats2.dev;
        } catch (error) {
            console.error('Error getting directory stats:', error);
            return true
        }
    }

    /**
     * different_drive_sync
     * 
     * Uses the file system stat methods to determine if the files are on different drives
     * 
     * @param {string} src 
     * @param {string} dest 
     */
    different_drive_sync(src,dest) {
        try {
            const stats1 = fs.statSync(src);
            const stats2 = fs.statSync(dest);

            return stats1.dev !== stats2.dev;
        } catch (error) {
            console.error('Error getting directory stats:', error);
            return true
        }
    }





    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

    /**
     * dir_maker
     * 
     * create a directory -- assume parent directory exists
     * > guards against THROW
     * 
     * 
     * @param {string} path -- a path to the directory to be created
     * @param {object} options
     * 
     * @returns boolean
     */
    async dir_maker(path,options) {
        try {
            await fsPromises.mkdir(path,options)
        } catch(e) {
            if (  e.code == "EMFILE" ) {
                if ( this.EMFILE_handler ) {
                    let self = this
                    this.EMFILE_handler.defer(async () => { return await self.dir_maker(path,options) })
                }
            }
            if ( e.code !== 'EEXIST') {
                console.error(e)
                return false
            }
        }
        return true
    }


    /**
     * ensure_directories
     * 
     * -- attempts to construct or verify all directories along the path up to an optional file
     * -- guards against THROW
     * -- parameter :: path 
     * 
     * @param {string} path -- a path to the file to be removed
     * @param {string} top_dir -- an optional top level directy path under which directories will be created  
     * @param {boolean} is_file_path -- optional -- true if the path is for a file (does not try to figure this out)
     * @param {Function} app_cb -- optional -- a callback (parent_directroy,file) => {} available to subclasses for ops and bookkeeping
     * 
     * @returns string | boolean
     */
    async ensure_directories(a_path,top_dir,is_file_path,app_cb) {
        //
        let sep = path.sep
        let c_path = top_dir ? `${top_dir}${sep}${a_path}` : a_path
        let file = ""
        if ( is_file_path ) {
            file = path.basename(c_path)
            c_path = path.dirname(c_path)
        }
        //
        let status = await this.dir_maker(c_path,{ "recursive" : true })
        if ( status ) {
            if ( is_file_path ) {
                let file_path = [c_path,file].join(sep)   // includes the top dir parameter possibly
                if ( typeof app_cb === 'function' ) {
                    app_cb(c_path,file_path)  // the file is known to be bottom of the path
                }
                c_path = file_path
            }
            return c_path       // top dir + path + file (if there it is a file)
        }
        return false
    }
    

    /**
     * dir_remover
     * 
     * -- remove a directory -- assume parent directory exists
     * -- parameter :: upath 
     * 
     * @param {string} upath -- a path to the directory to be removed
     * @param {boolean} recursive -- from fsPromises 'rm' -- will remove subdirectories if true
     * @returns boolean
     */
    async dir_remover(upath,recursive = false) {
        try {
            if ( recursive ) {
                await fsPromises.rm(upath,{ 'recursive': true })
            } else {
                await fsPromises.rmdir(upath)
            }
        } catch(e) {
            if (  e.code == "EMFILE" ) {
                if ( this.EMFILE_handler ) {
                    let self = this
                    this.EMFILE_handler.defer(() => { return self.dir_remover(upath,recursive) })
                }
            }
            if ( e.code !== "ENOENT" ) {
                console.error(e)
                return false
            }
        }
        return true
    }


    /**
     * dir_reader
     * 
     * wraps fsPromises.readdir with a try/catch 
     * 
     * returns a list of files from the directory 
     * if there is an error returns []
     * 
     * @param {string} path 
     * @returns array - the list of files in the directory
     */
    async dir_reader(path) {
        try {
            let files = await fsPromises.readdir(path);
            return files
        } catch (e) {
            console.error(e);
        }
        return [] 
    }

    
    /**
     * file_remover
     * 
     * -- remove a directory -- assume a valid path
     * -- guards against THROW
     * 
     * @param {string} path -- a path to the file to be removed
     * @returns boolean
     */
    async file_remover(path) {
        try {
            await fsPromises.rm(path)
            return true
        } catch(e) {
            if (  e.code == "EMFILE" ) {
                if ( this.EMFILE_handler ) {
                    let self = this
                    this.EMFILE_handler.defer(() => { return self.file_remover(path) })
                }
            }
            console.log(path)
            console.log(e)
            return false
        }
    }


    /**
     * write_out_string
     * -- write string to file -- assume a valid path
     * -- guards against THROW
     * 
     * 
     * @param {string} path -- a path to the file that will contain the string
     * @param {string} str -- a string to be written
     * @param {object} ce_flags -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
     * @returns boolean
     */
    async write_out_string(path,str,ce_flags) {
        try {
            if ( ce_flags ) {
                await fsPromises.writeFile(path,str,ce_flags)
            } else {
                await fsPromises.writeFile(path,str)
            }    
        } catch (e) {
            if (  e.code == "EMFILE" ) {
                if ( this.EMFILE_handler ) {
                    let self = this
                    this.EMFILE_handler.defer(() => { return self.write_out_string(path,str,ce_flag) })
                }
            }
            console.log(path)
            console.log(e)
            return false
        }
        return true
    }


    /**
     * write_append_string
     * 
     * -- append string to the end of a file -- assume a valid path
     * -- guards against THROW
     * @param {string} path -- a path to the file that will contain the string
     * @param {string} str -- a string to be written
     * @param {object} ce_flags -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
     * @returns boolean
     */
    async write_append_string(path,str,ce_flags) {
        try {
            if ( ce_flags ) {
                await fsPromises.appendFile(path,str,ce_flags)
            } else {
                await fsPromises.appendFile(path,str)
            }    
        } catch (e) {
            if (  e.code == "EMFILE" ) {
                if ( this.EMFILE_handler ) {
                    let self = this
                    this.EMFILE_handler.defer(() => { return self.write_append_string(path,str,ce_flag) })
                }
            }
            console.log(path)
            console.log(e)
            return false
        }
        return true
    }
    
           
    /**
     * data_reader
     * 
     * -- read a file from disk --- any format
     * -- will THROW
     * 
     * 
     * @param {string} a_path -- a path to the file that contains the string to be read
     * @returns buffer
     */ 
    async data_reader(a_path) {             // possible THROW
        return await fsPromises.readFile(a_path)
    }

       
    /**
     * json_data_reader
     * 
     * -- read a JSON formatted file from disk
     * -- will THROW
     * 
     * @param {string} a_path -- a path to the file that contains the string to be read
     * @param {object} options -- fsPromises options
     * @returns object
     */    
    async json_data_reader(a_path,options) {             // possible THROW
        let str_buff = await fsPromises.readFile(a_path,options)
        let str = str_buff.toString()
        let obj = JSON.parse(str)
        return obj
    }


    /**
     * file_copier
     * 
     * -- copy a file from path_1 to path_2 -- assume valid paths
     * -- guards against THROW
     * 
     * @param {string} path_1 -- source path
     * @param {string} path_2 -- destination path
     * @returns boolean
     */
    async file_copier(path_1,path_2) {
        try {
            await fsPromises.copyFile(path_1,path_2)
            return true
        } catch(e) {
            if (  e.code == "EMFILE" ) {
                if ( this.EMFILE_handler ) {
                    let self = this
                    this.EMFILE_handler.defer(() => { return self.file_copier(path_1,path_2) })
                }
            }
            console.log(path_1)
            console.log(e)
            return false
        }
    }


    /**
     * ensured_file_copier
     * 
     * -- copy a file from path_1 to path_2 -- assume valid paths
     * -- guards against THROW
     * 
     * @param {string} path_1 -- source path
     * @param {string} path_2 -- destination path
     * @returns boolean
     */
    async ensured_file_copier(path_1,path_2) {
        let status = await this.ensure_directories(path_2,false,true)
        if ( status ) {
            status = await this.file_copier(path_1,path_2)
        }
        return status
    }


    /**
     * file_mover
     * 
     * -- copy a file from path_1 to path_2 -- assume valid paths
     * -- guards against THROW
     * 
     * @param {string} path_1 -- source path
     * @param {string} path_2 -- destination path
     * @returns boolean
     */
    async file_mover(path_1,path_2) {
        if ( path_1 === path_2 ) {
            return true
        }
        let diff_drive = await this.different_drive(path_1,path_2)
        if ( !(diff_drive) ) {
            try {
                await fsPromises.rename(path_1,path_2)
                return true
            } catch (e) {
                console.log(e)
                return false
            }
        } else {
            let status = await this.file_copier(path_1,path_2)
            if ( status ) {
                status = await this.file_remover(path_1)
            }
            return status
        }
    }

    /**
     * ensured_file_mover
     * 
     * -- copy a file from path_1 to path_2 -- assume valid paths
     * -- guards against THROW
     * 
     * 
     * @param {string} path_1 -- source path
     * @param {string} path_2 -- destination path
     * @returns boolean
     */
    async ensured_file_mover(path_1,path_2) {
        let status = await this.ensured_file_copier(path_1,path_2)
        if ( status ) {
            status = await this.file_remover(path_1)
        }
        return status
    }


       
    /**
     * exists
     * 
     * -- wraps the access method -- assumes the path is a valid path
     * -- guards against THROW
     * 
     * @param {string} path -- a path to the file under test
     * @param {number} app_flags 
     * @returns boolean
     */         
    async exists(path,app_flags) {
        try {
            let flags = fs.constants.R_OK | fs.constants.W_OK
            if ( app_flags ) {
                flags = app_flags
            }
            await fsPromises.access(path, flags);
            return true
          } catch (e) {
            if ( e.code !== "ENOENT" ) {
                console.log(e)
            }
            return false
          }
    }


    /**
     * write_out_json
     * 
     * -- write string to file -- assume a valid path
     * -- guards against THROW
     * 
     * @param {string} path -- a path to the file that will contain the string
     * @param {object} obj -- a JSON stringifiable object
     * @param {number} ce_flags -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
     * @returns boolean
     */
    async write_out_json(path,obj,ce_flags) {
        try {
            let str = JSON.stringify(obj)
            return await this.write_out_string(path,str,ce_flags)
        } catch (e) {
            console.log(path)
            console.log(e)
            return false
        }
    }


    /**
     * load_data_at_path
     * 
     * -- read a file from disk --- any format 
     * -- guards against THROW
     * 
     * 
     * @param {string} path -- a path to the file that contains the string to be read
     * @returns boolean | string
     */     
    async load_data_at_path(path) {
        try {
            if ( !(path) ) return false
            let data = await this.data_reader(path)
            return(data.toString())
        } catch (e) {
            console.log(">>-------------load_data read------------------------")
            console.log(e)
            console.log(path)
            console.log("<<-------------------------------------")
        }
        return false
    }

    
    /**
     * load_json_data_at_path
     * 
     * -- read a JSON formatted file from disk
     * -- guards against THROW
     * 
     * 
     * @param {string} path -- a path to the file that contains the string to be read
     * @param {object} options -- fsPromises options
     * @returns boolean | object
     */     
    async load_json_data_at_path(path,options) {
        try {
            if ( !(path) ) return false
            return await this.json_data_reader(path,options)
        } catch (e) {
            console.log(">>-------------load_json_data read------------------------")
            console.log(e)
            console.log(path)
            console.log("<<-------------------------------------")
        }
        return false
    }


    /**
     * output_string
     * 
     * -- write string to file -- ensures path
     * -- guards against THROW
     * 
     * 
     * @param {string} path -- a path to the file that will contain the string
     * @param {string} str -- a string to be written
     * @param {number} ce_flags -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
     * @param {string} top_dir -- optional as starting point for the directory
     * @returns boolean
     */
    async output_string(path,str,ce_flags,top_dir) {
        try {
            let final_path = await this.ensure_directories(path,top_dir,true)
            if ( final_path === false ) return false
            return this.write_out_string(final_path,str,ce_flags)
        } catch (e) {
            console.log(path)
            console.log(e)
            return false
        }
    }


    /**
     * output_append_string
     * 
     * -- append string to the end of a file -- assume a valid path
     * -- guards against THROW
     * 
     * 
     * @param {string} path -- a path to the file that will contain the string
     * @param {string} str -- a string to be written
     * @param {number} ce_flags -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
     * @param {string} top_dir -- optional as starting point for the directory
     * @returns 
     */
    async output_append_string(path,str,ce_flags,top_dir) {
        try {
            let final_path = await this.ensure_directories(path,top_dir,true)
            if ( final_path === false ) return false
            return this.write_append_string(final_path,str,ce_flags)
        } catch (e) {
            console.log(path)
            console.log(e)
            return false
        }
    }
    
    
    /**
     * output_json
     * 
     * -- write string to file -- assume a valid path
     * -- guards against THROW
     * 
     * 
     * @param {string} path -- a path to the file that will contain the string
     * @param {object} obj -- a string to be written
     * @param {number} ce_flags -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
     * @param {string} top_dir -- optional as starting point for the directory
     * @returns 
     */
    async output_json(path,obj,ce_flags,top_dir) {
        try {
            let final_path = await this.ensure_directories(path,top_dir,true)
            if ( final_path === false ) return false
            return await this.write_out_json(final_path,obj,ce_flags)
        } catch (e) {
            console.log(path)
            console.log(e)
            return false
        }
    }

    /**
     * 
     * watch
     * 
     * same as fsPromises watch, but wraps the error handling in favor of boolean status report
     * 
     * @param {string} path 
     * @returns boolean -- true if the path can be watched, fals otherwise
     * 
     */
    watch(path) {
        try {
            return fsPromises.watch(path);
        } catch (e) {
            console.log(e)
        }
        return false
    }

}



/**
 * FsExtra
 * 
 * Make use of the names provided by fs-extra 
 * although some behavior may differ. Will be noted when it does.
 * 
 * 
 */
class FsExtra extends FileOperations {

    /**
     * constructor
     * 
     * @param {obj} conf 
     */
    constructor(conf) {
        super(conf)
    }


    // 1
    /**
     * copy
     * 
     * uses cp
     * 
     * @param {string} src 
     * @param {string} dest 
     * @param {object} opts 
     */
    async copy(src, dest, opts = {}) {
        try {
            //
            await fsPromises.cp(src,dest,opts)
            //
            return true
        } catch(e) {
            console.log(e)
            return false
        }
    }

    /**
     * copySync
     * 
     * @param {string} src 
     * @param {string} dest 
     * @param {object} opts 
     */
    copySync(src, dest, opts = {}) {
        try {
            //
            fs.cpSync(src,dest,opts)
            //
            return true
        } catch(e) {
            console.log(e)
            return false
        }
    }

    // 2,3
    /**
     * move
     * 
     * @param {string} src 
     * @param {string} dest 
     * @param {object} opts 
     * @returns bollean
     */
    async move(src, dest, opts = {}) {
        if ( await this.exists(dest) && !opts.overwrite ) {
            return false
        }
        return await this.file_mover(src,dest) 
    }

    /**
     * moveSync
     * 
     * @param {string} src 
     * @param {string} dest 
     * @param {object} opts 
     * @returns boolean
     */
    moveSync(src, dest, opts) {
        //
        if ( fs.existsSync(dest) && !opts.overwrite ) {
            return false
        }
        //
        if ( this.different_drive_sync(src, dest) ) {
            if ( this.copySync(src, dest, opts) ) {
                this.removeSync(src)
                return true
            }
            return false
        }
        //
        fs.renameSync(src,dest)
        return true
    }

    // 4,5
    /**
     * emptyDir
     * 
     * empties out a directory unless it does not exists.
     * If it does not exist, then it creates it with no files.
     * 
     * @param {string} dir 
     * @param {object} options 
     * @param {Function} cb 
     */
    async emptyDir (dir,options,cb) {
        if ( !(await this.exists(dir)) ) {   // create an empty directory
            await this.ensure_directories(dir)
        } else {
            let sep = path.sep
            let promsises = []
            //
            try {
                const dir = await fsPromises.opendir(dir,options);
                for await (const dirent of dir) {
                    let entry = `${dir}${sep}${dirent.name}`
                    promsises.push( fsPromises.rm(entry,{ 'recursive': true }) )
                }
                Promise.all(promsises)
            } catch (err) {
                if ( cb ) {
                    cb(err)
                }
            }
        }
    }


    /**
     * emptyDirSync
     * 
     * @param {string} dir 
     * @param {object} options 
     * @param {Function} cb 
     */
    emptyDirSync (dir,options,cb) { 
        //
        try {
            if ( this.existsSync(dir) ) {
                let sep = path.sep
                //
                let fs_dir = fs.opendirSync(dir,options)
                let dir_ent = fs_dir.readSync()
                while ( dir_ent ) {
                    //
                    let entry = `${dir}${sep}${dirent.name}`
                    fs.rmSync(entry,{ 'recursive': true })
                    dir_ent = fs_dir.readSync()
                    //
                }
            } else {
                this.makeDirSync(dir,options)  // create an empty directory
            }
        } catch (err) {
            if ( cb ) {
                cb(err)
            }
        }

    }

    // 6,7
    /**
     * createFile
     * 
     * @param {string} file 
     * @returns boolean
     */
    async createFile(file) {
        return await this.output_string(file,'')
    }

    /**
     * createFileSync
     * 
     * 
     * @param {string} file 
     * @param {Function} cb 
     * @returns boolean
     */
    createFileSync(file,cb) {
        try {
            if ( !(this.existsSync(file)) ) {
                let dir = path.dirname(file)
                if ( dir ) {
                    this.makeDirSync(dir)
                    fs.writeFileSync(file,'')
                    fs.truncateSync(file)
                }
            }
        } catch (e) {
            if ( typeof cb === "function" ) {
                cb(e)
            }
            return false
        }
        if ( typeof cb === "function" ) { cb() }
        return true
    }

    // 8,9
    /**
     * createLink
     * 
     * @param {string} srcpath 
     * @param {string} dstpath 
     * @returns boolean
     */
    async createLink(srcpath, dstpath) {
        //
        let {srcStat, dstStat} = this.getStats(srcpath, dstpath, {'dereference' : true})

        if (dstStat && this.areIdentical(srcStat, dstStat)) return

        const containing_dir = path.dirname(dstpath)

        let status = await this.ensureDir(containing_dir)
        if ( status ) {
            return await fsPromises.link(srcpath, dstpath)
        }
        //
        return false
    }

    /**
     * createLinkSync
     * 
     * @param {string} srcpath 
     * @param {string} dstpath 
     * @returns boolean
     */
    createLinkSync(srcpath, dstpath) {
        let {srcStat, dstStat} = this.getStatsSync(srcpath, dstpath, {'dereference' : true})
        //
        if (dstStat && this.areIdentical(srcStat, dstStat)) return
        //
        const containing_dir = path.dirname(dstpath)
        try {
            fs.makeDirSync(containing_dir)
        } catch (e) {
            console.log(e)
        } finally {
            return fs.linkSync(srcpath,dstpath)
        }
    }


    /**
     * createSymlink
     * 
     * @param {string} srcpath 
     * @param {string} dstpath 
     * @param {string} type 
     */
    async createSymlink (srcpath, dstpath, type) {
        //
        let src_p = path.resolve(srcpath)
        let dst_p = path.resolve(dstpath)

        let {srcStat, dstStat} = await this.getStats(src_p, dst_p)

        if (srcStat && srcStat.isSymbolicLink()) {
            if ( this.areIdentical(srcStat, dstStat) ) return
        }

        const containing_dir = path.dirname(dstpath)

        let status = await this.ensureDir(containing_dir)
        if ( status ) {
            return await fsPromises.symlink(srcpath, dstpath)
        }
        //
    }


    /**
     * createSymlinkSync
     * 
     * @param {string} srcpath 
     * @param {string} dstpath 
     * @param {string} type 
     */
    createSymlinkSync(srcpath, dstpath, type) {

        let src_p = path.resolve(srcpath)
        let dst_p = path.resolve(dstpath)


        const containing_dir = path.dirname(dst_p)
        try {
            fs.makeDirSync(containing_dir)
        } catch (e) {
            console.log(e)
        } finally {
            return fs.symlinkSync(src_p,dst_p)
        }

    }




    // 22,23
    /**
     * outputFile
     * 
     * @param {string} path 
     * @param {string} str 
     * @param {string} encoding 
     * 
     * @returns boolean
     */
    async outputFile(path, str, encoding = 'utf-8') {
        return await this.output_string(path,str,ce_flags)
    }

    /**
     * outputFileSync
     * 
     * @param {string} file 
     * @param  {...any} args 
     * 
     * @returns boolean
     */
    outputFileSync(file, ...args) {
        try {
            this.makeDirSync(file, options)
            fs.writeFileSync(file, ...args)
            return true
        } catch (e) {
            return false
        }
    }


    // 16,17
    /**
     * outputJson
     * 
     * @param {string} file 
     * @param {object} obj 
     * @param {object} options
     *  
     * @returns boolean
     */
    async outputJson (file, obj, options = {}) {
        return await this.output_json(file,obj,options)
    }


    /**
     * outputJsonSync
     * 
     * @param {string} file 
     * @param {object} obj 
     * @param {object} options 
     * @returns boolean
     */
    outputJsonSync (file, obj, options) {
        try {
            let str = JSON.stringify(obj)
            return this.outputFileSync(file,str,options)
        } catch (e) {
            console.log(path)
            console.log(e)
            return false
        }
    }

    /**
     * readJson
     * 
     * @param {string} path 
     * @param {object} options 
     * @returns string
     */
    async readJson(path,options) {
        return this.load_json_data_at_path(path,options)
    }

    /**
     * readJsonSync
     * 
     * @param {string} file 
     * @param {object} options 
     */
    readJsonSync(file,options) {
        try {
            let str_data = fs.readFileSync(file,options).toString()
            let obj = JSON.parse(str_data)
            return obj
        } catch(e) {
            return false
        }
    }

    // 18,19
    /**
     * makeDir
     * 
     * also: mkdirs, mkdirp, ensureDir
     * @param {string} dir 
     * @param {object} options 
     * 
     * @returns boolean
     */
    async makeDir (dir, options) {
        return await this.dir_maker(dir,options)
    }

    /**
     * mkdirs
     * mkdirp
     * ensureDir
     * 
     * @param {string} dir 
     * @param {object} options 
     * @returns boolean
     */
    async mkdirs (dir, options) { return this.makeDir (dir, options) }
    async mkdirp (dir, options) { return this.makeDir (dir, options) }
    async ensureDir (dir, options) { return this.makeDir (dir, options) }


    /**
     * makeDirSync
     * 
     * also: mkdirpSync, ensureDirSync
     * 
     * @param {string} dir 
     * @param {object} options 
     * @returns booleans | string
     */
    makeDirSync(dir, options) {
        //
        //checkPath(dir)
        let its_mode = (typeof options === 'object') && (typeof options.mode === 'string' || typeof options.mode === 'number') ? options.mode : undefined
        if ( !its_mode && typeof options === 'number' ) its_mode = options
    
        return fs.mkdirSync(dir, {
            mode: its_mode,
            recursive: true
        })
    }

    /**
     * mkdirpSync
     * 
     * @param {string} dir 
     * @param {object} options 
     * @returns boolean
     */
    mkdirpSync(dir, options) { return this.makeDirSync (dir, options) }
    
    /**
     * ensureDirSync
     * 
     * @param {string} dir 
     * @param {object} options 
     * @returns boolean
     */
    ensureDirSync(dir, options) { return this.makeDirSync (dir, options) }


    // 25
    /**
     * pathExists
     * 
     * this is an alias
     * 
     * @param {string} path 
     * @returns boolean
     */
    pathExists(path) {
        return fs.existsSync(path)
    }

    // 26
    /**
     * removeSync
     * 
     * this is nearly an alias, but sets `recursive` and `force`
     * 
     * @param {string} path 
     */
    removeSync(path) {
        fs.rmSync(path, { recursive: true, force: true })
    }

    // 27
    /**
     * remove
     * 
     * @param {string} path 
     * @param {Function} callback 
     */
    remove(path,callback) {
        try {
            this.removeSync(path)
        } catch (e) {
            callback(null,e)
        }
        callback()
    }

    // 

    // 28, 29
    /**
     * getStats
     * 
     * 
     * 
     * 
     * @param {string} src 
     * @param {string} dest 
     * @param {object} opts 
     */
    async getStats(src, dest, opts) {
        try {
            if ( opts.dereference ) {
                let [srcStat, destStat] = await Promise.all([
                    fsPromises.lstat(src,opts),fsPromises.lstat(dest,opts),
                ])
                return {srcStat, destStat}
            } else {
                let [srcStat, destStat] = await Promise.all([
                    fsPromises.stat(src,opts),fsPromises.stat(dest,opts),
                ])
                return {srcStat, destStat}
            }
        } catch (e) {
            if (e.code === 'ENOENT') return null
            throw err
        }
    }

    /**
     * getStatsSync
     * 
     * @param {string} src 
     * @param {string} dest 
     * @param {object} opts 
     */
    getStatsSync(src, dest, opts) {
        try {
            if ( opts.dereference ) {
                let [srcStat, destStat] = [
                    fs.lstatSync(src,opts),fs.lstatSync(dest,opts),
                ]
                return {srcStat, destStat}
            } else {
                let [srcStat, destStat] = [
                    fs.statSync(src,opts),fs.statSync(dest,opts),
                ]
                return {srcStat, destStat}
            }
        } catch (e) {
            if (e.code === 'ENOENT') return null
            throw err
        }
    }


    // 34,35
    /**
     * areIdentical
     * 
     * compares fields of a stat objects including: dev and ino
     * 
     * @param {object} srcStat 
     * @param {object} destStat 
     */
    areIdentical(srcStat, destStat) {
        return (destStat.ino !== undefined)
                 && (destStat.dev !== undefined) 
                 && (destStat.ino === srcStat.ino)
                 && (destStat.dev === srcStat.dev)
    }

    /**
     * isSrcSubdir
     * 
     * @param {string} src 
     * @param {string} dest 
     */
    isSrcSubdir(src, dest) {
        const srcArr = path.resolve(src).split(path.sep).map(i => i)
        const destArr = path.resolve(dest).split(path.sep).map(i => i)
        return srcArr.every((cur, i) => destArr[i] === cur)
    }

}


module.exports = FsExtra  // as file operations ... see index.js
