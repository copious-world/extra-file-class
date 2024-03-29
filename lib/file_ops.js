// 

const fsPromises = require('fs/promises')
const fs = require('fs')

//
// FileOperations provides a class with override capability that wraps standard node.js file calls from fs/Promises
// Includes the capability of an endpoint server. Provides a bridge of inclusion for application calls for an enpoint
// that uses file operations.
// Most wrappers catch fs/Promises exceptions except where noted. Methods return false if data cannot be obtained.
// 

class FileOperations {

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

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
   
    // dir_maker -- create a directory -- assume parent directory exists
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the directory to be created
    //
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


    // ensure_directories -- attempts to construct or verify all directories along the path up to an optional file
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file to be removed
    //                  top_dir -- an optional top level directy path under which directories will be created 
    //                  is_file_path -- optional -- true if the path is for a file (does not try to figure this out)
    //                  app_cb -- optional -- a callback (parent_directroy,file) => {} available to subclasses for ops and bookkeeping

    async ensure_directories(path,top_dir,is_file_path,app_cb) {
        //
        let c_path = top_dir ? `${top_dir}/${path}` : path
        let file = ""
        if ( is_file_path ) {
            let p_array = c_path.split('/')
            file = p_array.pop()
            c_path = p_array.join('/')
        }
        //
        let status = await this.dir_maker(c_path,{ "recursive" : true })
        if ( status ) {
            if ( is_file_path ) {
                let file_path = [c_path,file].join('/')   // includes the top dir parameter possibly
                if ( typeof app_cb === 'function' ) {
                    app_cb(c_path,file_path)  // the file is known to be bottom of the path
                }
                c_path = file_path
            }
            return c_path       // top dir + path + file (if there it is a file)
        }
        return false
    }
    

    // dir_remover -- remove a directory -- assume parent directory exists
    //           -- guards against THROW
    //  -- parameter :: upath -- a path to the directory to be removed
    //                  recursive -- from fsPromises 'rm' -- will remove subdirectories if truede stoppage conditions if true
    //
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


    // dir_reader

    async dir_reader(path) {
        try {
            let files = await fsPromises.readdir(path);
            return files
        } catch (e) {
            console.error(e);
        }
        return [] 
    }

    // file_remover -- remove a directory -- assume a valid path
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file to be removed
    //
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

    // write_out_string -- write string to file -- assume a valid path
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file that will contain the string
    //                  str -- a string to be written
    //                  ce_flags  -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
    //
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


    // write_append_string -- append string to the end of a file -- assume a valid path
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file that will contain the string
    //                  str -- a string to be written
    //                  ce_flags  -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
    //
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
    


    // data_reader -- read a file from disk --- any format 
    //           -- will THROW
    //  -- parameter :: a_path -- a path to the file that contains the string to be read
    //             
    async data_reader(a_path) {             // possible THROW
        return await fsPromises.readFile(a_path)
    }

    // json data_reader -- read a JSON formatted file from disk
    //           -- will THROW
    //  -- parameter :: a_path -- a path to the file that contains the string to be read
    //             
    async json_data_reader(a_path) {             // possible THROW
        let str_buff = await fsPromises.readFile(a_path)
        let str = str_buff.toString()
        let obj = JSON.parse(str)
        return obj
    }


    // file_copier -- copy a file from path_1 to path_2 -- assume valid paths
    //           -- guards against THROW
    //  -- parameter :: path_1 -- source path
    //                  path_2 -- destination path
    //

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


    // ensured_file_copier -- copy a file from path_1 to path_2 -- assume valid paths
    //           -- guards against THROW
    //  -- parameter :: path_1 -- source path
    //                  path_2 -- destination path
    //

    async ensured_file_copier(path_1,path_2) {
        let status = await this.ensure_directories(path_2,false,true)
        if ( status ) {
            status = await this.file_copier(path_1,path_2)
        }
        return status
    }


    // file_mover -- copy a file from path_1 to path_2 -- assume valid paths
    //           -- guards against THROW
    //  -- parameter :: path_1 -- source path
    //                  path_2 -- destination path
    //

    async file_mover(path_1,path_2) {
        let  status = await this.file_copier(path_1,path_2)
        if ( status ) {
            status = await this.file_remover(path_1)
        }
        return status
    }


    // ensured_file_mover -- copy a file from path_1 to path_2 -- assume valid paths
    //           -- guards against THROW
    //  -- parameter :: path_1 -- source path
    //                  path_2 -- destination path
    //

    async ensured_file_mover(path_1,path_2) {
        let status = await this.ensured_file_copier(path_1,path_2)
        if ( status ) {
            status = await this.file_remover(path_1)
        }
        return status
    }



    // exists -- wraps the access method -- assumes the path is a valid path
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file under test
    //                  
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


    // write_out_json -- write string to file -- assume a valid path
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file that will contain the string
    //                  obj -- a JSON stringifiable object
    //                  ce_flags  -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
    //  -- returns false on failing either stringify or writing
    //
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


    // load_data_at_path -- read a file from disk --- any format 
    //           -- guards against THROW
    //  -- parameter :: a_path -- a path to the file that contains the string to be read
    //             
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

    // load_json_data_at_path -- read a JSON formatted file from disk
    //           -- guards against THROW
    //  -- parameter :: a_path -- a path to the file that contains the string to be read
    //             
    async load_json_data_at_path(path) {
        try {
            if ( !(path) ) return false
            return await this.json_data_reader(path)
        } catch (e) {
            console.log(">>-------------load_json_data read------------------------")
            console.log(e)
            console.log(path)
            console.log("<<-------------------------------------")
        }
        return false
    }



    // output_string -- write string to file -- ensures path
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file that will contain the string
    //                  str -- a string to be written
    //                  ce_flags  -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
    //                  top_dir -- optional as starting point for the directory
    //
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


    // output_append_string -- append string to the end of a file -- assume a valid path
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file that will contain the string
    //                  str -- a string to be written
    //                  ce_flags  -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
    //                  top_dir -- optional as starting point for the directory
    //
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
    
    // output_json -- write string to file -- assume a valid path
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file that will contain the string
    //                  obj -- a JSON stringifiable object
    //                  ce_flags  -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
    //                  top_dir -- optional as starting point for the directory
    //  -- returns false on failing either stringify or writing
    //
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

    watch(path) {
        try {
            return fsPromises.watch(path);
        } catch (e) {
            console.log(e)
        }
        return false
    }

}


module.exports = FileOperations
