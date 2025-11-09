// something like path for web page

// https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
// https://web.dev/articles/origin-private-file-system


// https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/webkitdirectory


/*

<input type="file" id="file-picker" name="fileList" webkitdirectory multiple />
<output id="output"></output>

// ---- 

const output = document.getElementById("output");
const filePicker = document.getElementById("file-picker");top_dir

filePicker.addEventListener("change", (event) => {
  const files = event.target.files;

  for (const file of files) {
    output.textContent += `${file.webkitRelativePath}\n`;
  }
});


async function getNewFileHandle() {
  const opts = {
    types: [
      {
        description: "Text file",
        accept: { "text/plain": [".txt"] },
      },
    ],
  };
  return await window.showSaveFilePicker(opts);
}



// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----


const pickerOpts = {
  types: [
    {
      description: "Images",
      accept: {
        "image/*": [".png", ".gif", ".jpeg", ".jpg"],
      },
    },
  ],
  excludeAcceptAllOption: true,
  multiple: false,
};


// create a reference for our file handle
let fileHandle;

async function getFile() {
  // open file picker, destructure the one element returned array
  [fileHandle] = await window.showOpenFilePicker(pickerOpts);

  // run code with our fileHandle
}



//  getAsFileSystemHandle


elem.addEventListener("dragover", (e) => {
  // Prevent navigation.
  e.preventDefault();
});
elem.addEventListener("drop", async (e) => {
  // Prevent navigation.
  e.preventDefault();
  const handlesPromises = [...e.dataTransfer.items]
    // kind will be 'file' for file/directory entries.
    .filter((x) => x.kind === "file")
    .map((x) => x.getAsFileSystemHandle());
  const handles = await Promise.all(handlesPromises);

  // Process all of the items.
  for (const handle of handles) {
    if (handle.kind === "file") {
      // run code for if handle is a file
    } else if (handle.kind === "directory") {
      // run code for is handle is a directory
    }
  }
});





// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----


<p>Drag files and/or directories to the box below!</p>

<div id="dropzone">
  <div id="boxtitle">Drop Files Here</div>
</div>

<h2>Directory tree:</h2>

<ul id="listing"></ul>

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----


#dropzone {
  text-align: center;
  width: 300px;
  height: 100px;
  margin: 10px;
  padding: 10px;
  border: 4px dashed red;
  border-radius: 10px;
}

#boxtitle {
  display: table-cell;
  vertical-align: middle;
  text-align: center;
  color: black;
  font:
    bold 2em "Arial",
    sans-serif;
  width: 300px;
  height: 100px;
}

body {
  font:
    14px "Arial",
    sans-serif;
}

//  ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

let dropzone = document.getElementById("dropzone");
let listing = document.getElementById("listing");

function scanFiles(item, container) {
  let elem = document.createElement("li");
  elem.textContent = item.name;
  container.appendChild(elem);

  if (item.isDirectory) {
    let directoryReader = item.createReader();
    let directoryContainer = document.createElement("ul");
    container.appendChild(directoryContainer);
    directoryReader.readEntries((entries) => {
      entries.forEach((entry) => {
        scanFiles(entry, directoryContainer);
      });
    });
  }
}

dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
});


dropzone.addEventListener("drop", (event) => {
  let items = event.dataTransfer.items;

  event.preventDefault();
  listing.textContent = "";

  for (const item of items) {
    const entry = item.webkitGetAsEntry();

    if (entry) {
      scanFiles(entry, listing);
    }
  }
});


//  ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----



*/


/**
 * @classdesc
 * 
 * The FileOperationsWeb class wraps the same method names as FileOperations, but does it for web pages.
 * As such, this class uses the Origin Private File Sytems and the FileSystem classes available in 
 * browser implementations.
 * 
 * Synchronous operations are not available to web wokers. So, the class is broken into two classes, 
 * a promise based on and a synchrnous based one.
 * 
 * By default this class supports working with files in the Origin Private File System.
 * It may be configured to support working with files on the user's device or remote files.
 * 
 * Files on the user's device will be introduced into the object class instance of FileOperationsWeb by 
 * either the File System Access API or the FilesAndDirectories API.
 * 
 * 
 */

class FileOperationsWeb {

    /**
     * 
     * The constructor gets a hanlde to the Origin Private File System.
     * (It uses the promise "then" construct... )
     * And, it gets a handel to the user permitted device file system. 
     * If configured to do so.
     * 
     * The constructor also sets up a cache for file handles in the different file systems for later 
     * searching and access. The cache is an a JavaScript object with three top level fields "opfs", "user", and "remote".
     * 
     * Each of these has two maps, "files" and "changed". The "files" will map file paths to file handles. 
     * 
     * 
     * @param {object} conf 
     */
    constructor (conf) {
        if ( conf === undefined ) {
            conf = {}
        }
        //
        this.conf = conf   // methods having to do with directory and file picking
        this.opfsRoot = false;
        this.textEncoder = new TextEncoder();
        this.textDecoder = new TextDecoder();

        this.observers = {}

        navigator.storage.getDirectory().then((opfs) => {
            this.opfsRoot = opfs
        }).catch((e) => {
            console.log("this shouldn't happen")
            throw e
        })
        //
        this.top_dir = false
        this.user_dirs_supported = this.check_user_dir_support()
        this.top_dir_name = ""
        
        if ( conf.use_file_system ) {       // conf may be set up to show a modal on timeout or it may just attach handler to a button
            if ( typeof conf.top_dir_name === "string" ) {
                this.top_dir_name = conf.top_dir_name
            }
            this.schedule_user_dir_request(conf)       // the browser (if it suppors dir selection) needs a gesture (button click)
        }
        if ( typeof conf.remote  === 'object' ) {
            this.remote_file_com = conf.remote
        }
        //
        this.accessed = {
            "opfs" : {
                "files" : {},
                "dirs" : {},
                "changed" : {}
            },
            "user" : {
                "files" : {},
                "dirs" : {},
                "changed" : {}
            },
            "remote" : {
                "files" : {},
                "dirs" : {},
                "changed" : {}
            }
        }
    }



    /**
     * Verify the user has granted permission to read or write to the file, if
     * permission hasn't been granted, request permission.
     *
     * @param {FileSystemFileHandle} fileHandle File handle to check.
     * @param {boolean} withWrite True if write permission should be checked.
     * @return {boolean} True if the user has granted read/write permission.
     */
    async verifyPermission(fileHandle, withWrite) {
        try {
            const opts = {};
            if (withWrite) {
                opts.writable = true;
                // For Chrome 86 and later...
                opts.mode = 'readwrite';
            }
            // Check if we already have permission, if so, return true.
            if (await fileHandle.queryPermission(opts) === 'granted') {
                return true;
            }
            // Request permission to the file, if the user grants permission, return true.
            if (await fileHandle.requestPermission(opts) === 'granted') {
                return true;
            }
        } catch (e) {
            return false
        }
        // The user didn't grant permission, return false.
        return false;
    }


    /**
     * Search the directory identified by *path* in different locations (as previously recorded by add_file)
     * 
     * @param {string} path 
     * @returns string | boolean
     */
    dir_locus(path) {
        let entry = this.accessed.opfs.dirs[path]
        if ( entry ) {
            return "opfs"
        }
        //
        if ( (this.top_dir !== false) ) {
            entry = this.accessed.user.dirs[path]
            if ( entry ) {
                return "user"
            }
        }
        //
        entry = this.accessed.remote.dirs[path]
        if ( entry ) {
            return "remote"
        }
        //
        return false
    }


    /**
     * Search the file identified by *path* in different locations (as previously recorded by add_file)
     * 
     * @param {string} path 
     * @returns string | bpolean
     */
    file_locus(path) {
        let entry = this.accessed.opfs.files[path]
        if ( entry ) {
            return "opfs"
        }
        //
        entry = this.accessed.user.files[path]
        if ( entry ) {
            return "user"
        }
        //
        entry = this.accessed.remote.files[path]
        if ( entry ) {
            return "remote"
        }
        //
        return false
    }



    /**
     * Given a path to a file, this method obtains a handle for it, useful for later operations.
     * The handle will be derived in the file system specified in *locus*. 
     * The file handle will stored in the table, accessed under its locus in the file table.
     * 
     * @param {string} path 
     * @param {string} locus 
     */
    async add_file(path,locus) {
        if ( locus === undefined ) {
            locus = "opfs"
        }
        try {
            //
            let file_handle = false
            if ( locus === "opfs" ) {
                file_handle = await this.opfsRoot.getFileHandle(path);
            } else if ( locus === "user" && (this.top_dir !== false) ) {
                file_handle = await this.top_dir.getFileHandle(path)
            } else if ( locus === "remote" ) {
                file_handle = await this.remote_file_com.getFileHandle(path)
            }
            if ( file_handle ) {
                this.accessed[locus].files[path] = file_handle;
            }
            //
        } catch (e) {

        }
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
        if ( this.accessed.opfs.files[src] && this.accessed.opfs.files[dest]) {
            return false
        }
        if ( this.accessed.user.files[src] && this.accessed.user.files[dest]) {
            return false
        }
        if ( this.accessed.remote.files[src] && this.accessed.remote.files[dest]) {
            return false
        }
        return true
    }

    /**
     * is_dir
     * 
     * Calls on lstat, and if the directory exists, 
     * this will return the result of isDirectory
     * 
     * @param {string} path 
     * @returns boolean
     */
    async is_dir() {
        if ( this.accessed.opfs.dirs[src] ) {
            return true
        }
        if ( (this.top_dir !== false) && this.accessed.user.dirs[src] ) {
            return true
        }
        if ( this.accessed.remote.dirs[src] ) {
            return true
        }
        return false
    }


    /**
     * is_file
     * 
     * Calls on lstat, and if the directory exists, 
     * this will return the result of isFile
     * 
     * @param {string} path 
     * @returns boolean
     */
    async is_file() {
        if ( this.accessed.opfs.files[src] ) {
            return true
        }
        if ( (this.top_dir !== false) && this.accessed.user.files[src] ) {
            return true
        }
        if ( this.accessed.remote.files[src] ) {
            return true
        }
        return false
    }



    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----


    /**
     * 
     * @param {string} path 
     * @param {object} options 
     * @returns object | boolean  (dirHandle or false)
     */
    async get_parent_user_dir(path,options) {
        let pth = path
        if ( pth.indexOf('/') > 0 ) {
            pth = path.substring(0,path.lastIndexOf('/'))
        } else {
            return this.top_dir
        }
        let dir_handle = this.accessed.user.dirs[pth]
        if ( dir_handle !== undefined ) {
            return dir_handle
        }
        if ( options.recursive ) {
            let path_parts = pth.split('/')
            //
            let bread_crumb = this.top_dir_name
            if ( path_parts[0] === this.top_dir_name ) {
                path_parts.shift()
            }
            //
            let status = true
            for ( let dname of path_parts ) {
                bread_crumb += `/${dname}`
                // locus === "user"
                status = await this.dir_maker(bread_crumb,{ "locus" : "user" })  // don't make it recursive
                if ( !status ) return false
            }
        }
        return false
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
        if ( options === undefined ) {
            options = {}
        }
        if ( (options.locus === "user") && !(this.user_dirs_supported) ) {
            return false
        }
        try {
            if ( (options.locus == "remote") || (options.locus === "user") ) {
                if ( options.remote && (typeof this.remote_file_com === "function") ) {
                    let directoryHandle = await this.remote_file_com.dir_maker(path)
                    this.accessed.user.dirs[path] = directoryHandle
                } else if ( (options.locus === "user") && (this.top_dir !== false) ) {
                    let opts = Object.assign({create : true },options)
                    delete opts.locus
                    let ok = await this.verifyPermission(this.top_dir,true)
                    if ( !ok ) {
                        ok = await this.interactive_permission()
                    }
                    let dir_handle = ok ? await this.get_parent_user_dir(path,options) : false
                    if ( ok && dir_handle ) {
                        const directoryHandle = await dir_handle.getDirectoryHandle(path,opts);
                        this.accessed.user.dirs[path] = directoryHandle
                    }
                } else {
                    return false
                }
            } else {
                let opts = Object.assign({create : true },options)
                delete opts.locus
                const directoryHandle = await this.opfsRoot.getDirectoryHandle(path, opts);
                this.accessed.opfs.dirs[path] = directoryHandle
            }
        } catch(e) {
            return false
        }
        return true
    }


    /**
     * file_maker
     * 
     * create a file -- assume parent directory exists
     * > guards against THROW
     * 
     * 
     * @param {string} path -- a path to the directory to be created
     * @param {object} options
     * 
     * @returns boolean
     */
    async file_maker(path,options) {
        if ( options === undefined ) {
            options = {}
        }
        try {
            if ( (options.locus == "remote") || (options.locus === "user") ) {
                if ( options.remote && (typeof this.remote_file_com === "function") ) {
                    let fileHandle = await this.remote_file_com.file_maker(path)
                    this.accessed.user.files[path] = fileHandle
                } else if ( (options.locus === "user") && (this.top_dir !== false) ) {
                    let opts = Object.assign({create : true },options)
                    delete opts.locus
                    let ok = await this.verifyPermission(this.top_dir,true)
                    if ( !ok ) {
                        ok = await this.interactive_permission()
                    }
                    let dir_handle = ok ? await this.get_parent_user_dir(path,options) : false
                    if ( ok && dir_handle ) {
                        const fileHandle = await dir_handle.getFileHandle(path,opts);
                        this.accessed.user.files[path] = fileHandle
                    }
                } else {
                    return false
                }
            } else {
                let opts = Object.assign({create : true },options)
                delete opts.locus
                const fileHandle = await this.opfsRoot.getFileHandle(path, opts);
                this.accessed.opfs.files[path] = fileHandle
            }
        } catch(e) {
            return false
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
     * @param {string} locus -- one of "remote", "user", "opfs"
     * @param {boolean} is_file_path -- optional -- true if the path is for a file (does not try to figure this out)
     * @param {Function} app_cb -- optional -- a callback (parent_directroy,file) => {} available to subclasses for ops and bookkeeping
     * 
     * @returns string | boolean
     */
    async ensure_directories(a_path,top_dir,locus,is_file_path,app_cb) {
        //
        if ( (this.top_dir !== false) && (locus === "user") ) {
            console.log("user file system not supported in this browser")
            return false
        }
        //
        let sep = path.sep
        let c_path = top_dir ? `${top_dir}${sep}${a_path}` : a_path
        let file = ""
        if ( is_file_path ) {
            file = path.basename(c_path)
            c_path = path.dirname(c_path)
        }
        //
        let status = await this.dir_maker(c_path,{ "recursive" : true, "locus" : locus })
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
        let locus = this.dir_locus(upath)
        try {
            let dir_handle = false;
            if ( locus === "user" && (this.top_dir !== false) ) {
                dir_handle = this.top_dir
            } else if ( locus === "opfs" ) {
                dir_handle = this.opfsRoot
            } else if ( locus === "remote" ) {
                dir_handle = this.remote_file_com
            }
            if ( dir_handle ) {
                if ( recursive ) {
                    await dir_handle.removeEntry(upath,{ 'recursive': true })
                } else {
                    await dir_handle.removeEntry(upath)
                }
                delete this.accessed[locus].dirs[upath]
            }
        } catch(e) {
            return false
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
        let locus = this.dir_locus(path)
        try {
            let dir_handle = false;
            if ( locus === "user" && (this.top_dir !== false) ) {
                dir_handle = this.top_dir
            } else if ( locus === "opfs" ) {
                dir_handle = this.opfsRoot
            } else if ( locus === "remote" ) {
                dir_handle = this.remote_file_com
            }
            let files = []
            if ( dir_handle ) {
                files = dir_handle.keys()
            }
            return files
        } catch (e) {
            console.error(e);
        }
        return [] 
    }

    
    /**
     * 
     * file_remover
     * 
     * -- remove a directory -- assume a valid path
     * -- guards against THROW
     * 
     * @param {string} path -- a path to the file to be removed
     * @returns boolean
     */
    async file_remover(path) {
        let locus = this.file_locus(path)
        try {
            let dir_handle = false;
            if ( locus === "user"&& (this.top_dir !== false) ) {
                dir_handle = this.top_dir
            } else if ( locus === "opfs" ) {
                dir_handle = this.opfsRoot
            } else if ( locus === "remote" ) {
                dir_handle = this.remote_file_com
            }
            if ( dir_handle ) {
                await dir_handle.removeEntry(path,{ 'recursive': true })
                delete this.accessed[locus].files[path]
            }
        } catch(e) {
            return false
        }
        return true
    }


    /**
     * write_out_string
     * -- write string to file -- assume a valid path
     * -- guards against THROW
     * 
     * 
     * @param {string} path -- a path to the file that will contain the string
     * @param {string} str -- a string to be written
     * @param {object} options -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
     * @returns boolean
     */
    async write_out_string(path,str,options) {
        let locus = this.file_locus(path)
        if ( !locus ) {
            await this.file_maker(path,options)
            locus = this.file_locus(path)
        }
        try {
            let file_handle = false
            if ( ( locus === "user" ) || ( locus === "opfs" ) || ( locus === "remote" ) ) {
                file_handle = this.accessed[locus].files[path]
                if ( file_handle ) {
                    const writable = await file_handle.createWritable();
                    const content = this.textEncoder.encode(str);
                    writable.write(content);
                    // Close the file and write the contents to disk.
                    await writable.close();
                }
            } else {
                return false
            }
        } catch(e) {
            return false
        }
        return true
    }


    /**
     * 
     * write_append_string
     * 
     * -- append string to the end of a file -- assume a valid path
     * -- guards against THROW
     * 
     * @param {string} path -- a path to the file that will contain the string
     * @param {string} str -- a string to be written
     * @param {object} options -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
     * @returns boolean
     */
    async write_append_string(path,str,options) {
        let locus = this.file_locus(path)
        if ( !locus ) {
            await this.file_maker(path,options)
            locus = this.file_locus(path)
        }
        try {
            let file_handle = false
            if ( ( locus === "user" ) || ( locus === "opfs" ) || ( locus === "remote" ) ) {
                file_handle = this.accessed[locus].files[path]
                if ( file_handle ) {
                    const writable = await file_handle.createWritable();
                    const content = this.textEncoder.encode(str);
                    const size = file_handle.getSize()
                    writable.write(content, { at: size });
                    // Close the file and write the contents to disk.
                    await writable.close();
                }
            } else {
                return false
            }
        } catch(e) {
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
     * This file returns the blob, and does not convert the data to string or a data structure.
     * 
     * 
     * @param {string} a_path -- a path to the file that contains the string to be read
     * @returns blob
     */ 
    async data_reader(a_path,option) {             // possible THROW
        let locus = this.file_locus(a_path)
        if ( !locus ) {
            if ( typeof option === "object" ) {
                if ( option.locus ) {
                    locus = this.file_locus(a_path)
                } else {
                    return false
                }
            } else {
                return false
            }
        }
        try {
            let file_handle = false
            if ( ( locus === "user" ) || ( locus === "opfs" ) || ( locus === "remote" ) ) {
                file_handle = this.accessed[locus].files[a_path]
                if ( file_handle ) {
                    let file = await file_handle.getFile()
                    return file
                }
            } else {
                return false
            }
        } catch(e) {
            return false
        }
    }


    /**
     * json_data_reader
     * 
     * 
     * -- read a JSON formatted file from disk
     * -- will THROW
     * 
     * @param {string} a_path -- a path to the file that contains the string to be read
     * @param {object} options -- fsPromises options
     * @returns object
     */    
    async json_data_reader(a_path,options) {             // possible THROW
        let blob = await this.data_reader(a_path,options)
        if ( blob ) {
            try {
                let str = blob.text()
                let obj = JSON.parse(str)
                return obj
            } catch (e) {}
        }
        return {}
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
    async file_copier(path_1,path_2,options) {
        try {
            let file = await this.data_reader(path_1,options)
            this.write_out_string(path_2,file.text())
            return true
        } catch(e) {
            return false
        }
    }


    /**
     * ensured_file_copier
     *
     * -- copy a file from path_1 to path_2 -- assume valid paths for the source
     * -- guards against THROW
     * 
     * calls **file_copier** after calling **ensure_directories** applied to path_2.
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
     * -- move a file from path_1 to path_2 -- assume valid paths
     * -- guards against THROW
     * 
     * In the case of a different drive, **file_mover** calls **file_copier** and 
     * then removes the source file after the copy is successful.
     * 
     * Otherwise, calls rename.
     * 
     * @param {string} path_1 -- source path
     * @param {string} path_2 -- destination path
     * @returns boolean
     */
    async file_mover(path_1,path_2) {
        if ( path_1 === path_2 ) {
            return true
        }
        let status = await this.file_copier(path_1,path_2)
        if ( status ) {
            status = await this.file_remover(path_1)
        }
        return status
    }

    /**
     * ensured_file_mover
     * 
     * -- move a file from path_1 to path_2 -- assume valid paths
     * -- guards against THROW
     * 
     * **ensured_file_mover**  calls **ensured_file_copier** and then removes the source file after the copy is successful.
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
     * @returns boolean
     */         
    exists(path,option) {
        try {
            let locus = this.file_locus(path)
            if ( !locus ) {
                if ( typeof option === "object" ) {
                    if ( option.locus ) {
                        locus = this.file_locus(path)
                    } else {
                        return false
                    }
                } else {
                    return false
                }
            }
            return true
          } catch (e) {
            return false
          }
    }

 
    /**
     * exists_dir
     * 
     * -- wraps the access method -- assumes the path is a valid path
     * -- guards against THROW
     * 
     * @param {string} path -- a path to the file under test
     * @returns boolean
     */         
    async exists_dir(path,option) {
        try {
            let locus = this.dir_locus(path)
            if ( !locus ) {
                if ( typeof option === "object" ) {
                    if ( option.locus ) {
                        locus = this.dir_locus(path)
                    } else {
                        return false
                    }
                } else {
                    return false
                }
            }
            return true
          } catch (e) {
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
     * @returns boolean
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
     * @returns boolean
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
     * 
     * 
     * @param {string} path 
     * @param {Function} callback
     * @param {recursive} boolean
     * @returns boolean -- true if the path can be watched, fals otherwise
     * 
     */
    async watch(path,callback,recursive) {

        let locus = this.file_locus(path)
        if ( locus ) {
            let file_handle = this.accessed[locus].files[path]
            if ( file_handle ) {
                //
                const file_callback = (records, observer) => {
                    if ( callback(records) ) {
                        observer.disconnect();
                    }
                };
                //   
                let observer = new FileSystemObserver(file_callback);

                if ( locus === 'opfs' ) {
                    const syncHandle = await file_handle.createSyncAccessHandle();
                    await observer.observe(syncHandle);
                } else {
                    this.observers[path] = observer
                    observer.observe(file_handle)
                }
            }
        } else {
            locus = this.dir_locus(path)
            let dir_handle = this.accessed[locus].dirs[path]
            if ( dir_handle ) {
                //
                const dir_callback = (records, observer) => {
                    if ( callback(records) ) {
                        observer.disconnect();
                    }
                };
                //   
                let observer = new FileSystemObserver(dir_callback);
                this.observers[path] = observer
                observer.observe(dir_handle, { 'recursive' : recursive })
            }
        }

        return false
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
            await this.file_copier(src,dest,opts)
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
     * @returns boolean
     */
    async move(src, dest, opts = {}) {
        if ( this.exists(dest) && !opts.overwrite ) {
            return false
        }
        return await this.file_mover(src,dest) 
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
     */
    async emptyDir(dir,options) {
        if ( !(await this.exists(dir)) ) {   // create an empty directory
            await this.ensure_directories(dir)
        } else {
            let sep = '/'
            let promsises = []
            //
            let dir_handle = this.accessed[options.locus].dirs[dir]

            if ( dir_handle ) {
                for await (let name of dir_handle.keys()) {
                    let entry = `${dir}${sep}${name}`
                    promsises.push( this.dir_remover(entry,true) )
                }
                await Promise.all(promsises)
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
    async outputFile(path, str) {
        return await this.output_string(path,str)
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
     * readJson
     * 
     * @param {string} path 
     * @param {object} options 
     * @returns string
     */
    async readJson(path,options) {
        return this.load_json_data_at_path(path,options)
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

    // 

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
     * 
     * The application that wants to manipulate directories,
     * can configure the FileOperationsWeb class to provide a directory 
     * selection when they want the selection to occur. 
     * 
     * Directory selection is only available in a limited number of browsers. 
     * So, an application may use a configuration permitting these operations 
     * if it is aware that it is in a supporting browser.
     * 
     * The application configuration will proceed from within the constructor if the
     * configuration has a truthy field `dir_modal_button_id`.  This field, **`dir_modal_button_id`**
     * is usually the id of a button element some where in the web page.
     * 
     *  This method installs an **onclick** event handler on the button object.
     *  If the button does not exists, or if 'showDirectoryPicker' is not available,
     *  then, the operation will not take place nor be available later.
     * 
     * The application may choose to show a modal at some fixed time after the constructor calls this method.
     * If the configuration object has a field **`when_dir_modal`** along with another field **`dir_modal_id`**,
     * then this method will schedule a time when_dir_modal` milliseconds later to show the modal who id is `dir_modal_id`.
     * 
     * @param {object} conf 
     */
    schedule_user_dir_request(conf) {
        //
        if ( typeof conf !== 'object' ) {
            throw new Error("schedule_user_dir_request: conf parameter must be an object")
        }
        if ( !("showDirectoryPicker" in window) ) {
            console.log("showDirectoryPicker is not supported")
            return false
        }
        if ( (typeof conf.dir_modal_button_id !== "string") ) {
            console.log("no element defined for triggering directory handling")
            return false
        }
        //
        let modal_box_button = document.getElementById(conf.dir_modal_button_id)
        if ( modal_box_button ) {
            let self = this
            modal_box_button.onclick = (ev) => {
                //
                let opts = {}
                if ( self.top_dir_name ) {
                    opts.startIn = self.top_dir_name
                }
                //
                window.showDirectoryPicker(opts).then((dirHandle) => {
                    self.verifyPermission(dirHandle).then((p) => {
                        if ( p ) {
                            dirHandle.resolve().then((names) => {
                                console.log(names)
                                self.top_dir_name = names.join('/')
                            })
                            self.top_dir = dirHandle
                        }
                    })
                })
                //
            }
            if ( conf.when_dir_modal && conf.dir_modal_id ) {
                let modal_box = document.getElementById(conf.dir_modal_id)
                if ( modal_box ) {
                    setTimeout(() => {
                        modal_box.show()
                    },conf.when_dir_modal);
                }
            }
        }
    }


    async interactive_permission() {      // must get a user event to pass permission tests
        let conf = this.conf
        if ( conf.when_dir_modal && conf.dir_modal_id ) {
            let modal_box = document.getElementById(conf.dir_modal_id)
            if ( modal_box ) {
                let p = new Promise((resolve,reject) => {
                    modal_box.addEventListener("close", (e) => {
                        if ( favDialog.returnValue === "ok" ) {
                            resolve(favDialog.returnValue)
                        } else {
                            reject(favDialog.returnValue)
                        }
                    })
                    modal_box.show()
                })
            }
        }
    }


    /**
     * 
     * The application that wants to download files,
     * can configure the FileOperationsWeb class to provide file 
     * selection when they want the selection to occur. 
     * 
     * File selection, done by the file picker, is only available in a limited number of browsers. 
     * So, an application may use a configuration permitting these operations 
     * if it is aware that it is in a supporting browser.
     * 
     * The application configuration has a field `file_upload_modal_button_id`.  This field, **`file_upload_modal_button_id`**,
     * is usually the id of a button element somewhere in the web page.
     * 
     *  This method installs an **onclick** event handler on the button object.
     *  If the button does not exists, or if 'showOpenFilePicker' is not available,
     *  then, the operation will not take place nor be available later.
     * 
     * @param {object} conf 
     * @returns boolean
     */
    interactive_file_retrieval() {
        let conf = this.conf
        //
        if ( !("showOpenFilePicker" in window) ) {
            console.log("showDirectoryPicker is not supported")
            return false
        }
        if ( (typeof conf.file_upload_modal_button_id !== "string") ) {
            console.log("no element defined for triggering file loading")
            return false
        }
        //
        let modal_box_button = document.getElementById(conf.file_upload_modal_button_id)
        if ( modal_box_button ) {
            let self = this
            modal_box_button.onclick = (ev) => {
                //
                window.showDirectoryPicker().then((dirHandle) => {
                    self.verifyPermission(dirHandle).then((p) => {
                        if ( p ) {
                            self.top_dir = dirHandle
                            self.top_dir_name = dirHandle.name
                        }
                    })
                })
                //
            }
            return true
        }
        //
        return false
    }



    /**
     * 
     * The application that wants to download files,
     * can configure the FileOperationsWeb class to provide file 
     * selection when they want the selection to occur. 
     * 
     * File selection, done by the file picker, is only available in a limited number of browsers. 
     * So, an application may use a configuration permitting these operations 
     * if it is aware that it is in a supporting browser.
     * 
     * The application configuration has a field `file_dowload_modal_button_id`.
     * This field, **`file_dowload_modal_button_id`**,
     * is usually the id of a button element somewhere in the web page.
     * 
     *  This method installs an **onclick** event handler on the button object.
     *  If the button does not exists, or if 'showSaveFilePicker' is not available,
     *  then, the operation will not take place nor be available later.
     * 
     * @param {object} conf 
     * @returns boolean
     */
    interactive_file_download() {
        let conf = this.conf

        if ( !("showSaveFilePicker" in window) ) {
            console.log("showDirectoryPicker is not supported")
            return false
        }
        if ( (typeof conf.file_dowload_modal_button_id !== "string") ) {
            console.log("no element defined for triggering file loading")
            return false
        }

        let modal_box_button = document.getElementById(conf.file_dowload_modal_button_id)
        if ( modal_box_button ) {
            let self = this
            modal_box_button.onclick = (ev) => {
                //
                window.showDirectoryPicker().then((dirHandle) => {
                    self.verifyPermission(dirHandle).then((p) => {
                        if ( p ) {
                            self.top_dir = dirHandle
                        }
                    })
                })
                //
            }
            return true
        }
        return false
    }

    /**
     * At the time of this release,
     * the directory picker is available to some but not all browsers.
     * If the directory picker is not available,then it can be assumed that the file picker
     * is not available.
     * 
     * @returns boolean
     */
    check_user_dir_support() {
        if ( !("showDirectoryPicker" in window) ) {
            console.log("showDirectoryPicker is not supported")
            return false
        }
        return true
    }

}



/**
 * @classdesc
 * 
 * The FileOperationsWeb class wraps the same method names as FileOperations, but does it for web pages.
 * As such, this class uses the Origin Private File Sytems and the FileSystem classes available in 
 *
 */
class FileOperationsWebSync extends FileOperationsWeb {

    /**
     * 
     * The constructor gets a hanlde to the Origin Private File System.
     * (It uses the promise "then" construct... )
     * And, it gets a handel to the user permitted device file system. 
     * If configured to do so.
     * 
     * The constructor also sets up a cache for file handles in the different file systems for later 
     * searching and access. The cache is an a JavaScript object with three top level fields "opfs", "user", and "remote".
     * 
     * Each of these has two maps, "files" and "changed". The "files" will map file paths to file handles. 
     * 
     * 
     * @param {object} conf 
     */
    constructor (conf) {
        super(conf)
        this.opfsRoot = false;
    }




    /**
     * createFileSync
     * 
     * 
     * @param {string} file 
     * @param {object} opts 
     * @returns boolean
     */
    createFileSync(file,opts) {
        //
        if ( !this.exists(file) ) {
            this.add_file(file,opts.locus)
        }

        return true//
    }

    /**
     * copySync
     * 
     * @param {string} src 
     * @param {string} dest 
     * @param {object} opts 
     */
    async copySync(src, dest, opts = {}) {
        try {
            if ( this.exists(src) ) {
                let locus = this.file_locus(src)
                let src_file_handle = this.accessed[locus].files[src]
                if ( !this.exists(dest) ) {
                    this.add_file(dest,opts.locus)
                }
                locus = this.file_locus(dest)
                let dest_file_handle = this.accessed[locus].files[dest]
                if ( src_file_handle && dest_file_handle ) {
                     const accessHandle = await src_file_handle.createSyncAccessHandle({
                                                                        mode: "readwrite-unsafe",
                                                                    });
                    size = accessHandle.getSize();

                    const dataView = new DataView(new ArrayBuffer(size));
                    accessHandle.read(dataView, { at: 0 });

                    //let data = this.textDecoder.decode(dataView)

                    // Always close FileSystemSyncAccessHandle if done.
                    accessHandle.close();

                    const outHandle = await dest_file_handle.createSyncAccessHandle({
                                                                        mode: "readwrite-unsafe",
                                                                    });
                    outHandle.write(dataView,{ at : 0 })
                    outHandle.truncate(size)
                    outHandle.flush()
                    outHandle.close()
                    return true
                }
            }
            //
        } catch(e) {
            console.log(e)
            return false
        }
        return false
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
        if ( this.exists(dest) && !opts.overwrite ) {
            return false
        }
        //
        if ( this.copySync(src, dest, opts) ) {
            (async () => { await this.file_remover(src)})()
            return true
        }
        //
    }


    async readFileSync(src) {
        try {
            if ( this.exists(src) ) {
                let locus = this.file_locus(src)
                let src_file_handle = this.accessed[locus].files[src]
                if ( src_file_handle && dest_file_handle ) {
                    const accessHandle = await src_file_handle.createSyncAccessHandle({
                                                                        mode: "readwrite-unsafe",
                                                                    });
                    size = accessHandle.getSize();

                    const dataView = new DataView(new ArrayBuffer(size));
                    accessHandle.read(dataView, { at: 0 });
                    let data = this.textDecoder.decode(dataView)
                    accessHandle.close();

                    return data
                }
            }            
        } catch (e) {

        }
    }




    /**
     * outputFileSync
     * 
     * @param {string} file 
     * @param  {...any} args 
     * 
     * @returns boolean
     */
    async outputFileSync(file, ...args) {
        try {
            if ( !this.exists(dest) ) {
                this.add_file(dest,opts.locus)
            }
            locus = this.file_locus(dest)
            let dest_file_handle = this.accessed[locus].files[dest]
            //
            const outHandle = await dest_file_handle.createSyncAccessHandle({
                                                                mode: "readwrite-unsafe",
                                                            });
            outHandle.write(dataView,{ at : 0 })
            outHandle.truncate(size)
            outHandle.flush()
            outHandle.close()
            return true
        } catch (e) {
            return false
        }
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
     * readJsonSync
     * 
     * @param {string} file 
     * @param {object} options 
     */
    readJsonSync(file,options) {
        try {
            let str_data = this.readFileSync(file,options).text()
            let obj = JSON.parse(str_data)
            return obj
        } catch(e) {
            return false
        }
    }


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
        return this.exists(path)
    }


}
