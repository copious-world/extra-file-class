# extra-file-class

A node.js file operations class with methods wrapping fs/promises. Adds methods and options for caching, directory caching, path compilation.

>***This module may serve as a drop-in replacement for fs/promises.***

Otherwise, this module provides several classes with methods that make some file operations simple to use.

* **FileOperations** -- An extension of fs/promsises
* **FileOperationsCache** -- An extension of th class FileOperations with caching
* **DirectoryCache** -- A class object that manages objects stored in directories
* **PathManager** -- A drop-in replacement for node.js path module with path syntax extensions and path mapping.

> Version 1.0.0 adds support for web page files as well. These modules are accessible via roll-up. [(See below)](#web-fs)
> 
> Aliases for methods named as in `fs-extra` are provided for asynchronous cases.
> 

> Also, since 0.9.18, fs and fs/promsises are accessible via this class. [(See below)](#access-fs)


## affiliation


This package is produced buy [copious.world ![copious.world logo](https://www.copious.world/copiousLogo.svg "copious.world")](https://www.copious.world)<span style="font-weight:bold;">&#x2190;</span>

[<span style="font-weight:bold;">&#8594;</span> find his package on npm](https://www.npmjs.com/package/extra-file-class)


## install


```
npm install --save extra-file-class
```

## usage


This module has been used in other modules that can be found under [copious-world](https::/github.com/copious-world) on github. 


### importing/requiring

In most cases, the classes have been imported and instantiated in the applications. In the 1.0.0 release, the `require` statement (or import) statement can be used to get the class instance.

The following returns an instance of ***FileOperations***, without configuration.

```
const fs_promise = require('extra-file-class')()
```

The next statement does the same:

```
const fs_promise = require('extra-file-class')('dropin')
```

A configuration can be passed:

```
const fs_promise = require('extra-file-class')('dropin',config)
```

An instance of the file caching class can be returned:

```
const fs_cache = require('extra-file-class')('cache',config)
```

The instance provides acccess to the `fs` module as a field of the instances, e.g.:

```
const fs = fs_promise.fs
```

In any case, the classes can be imported from the module and then instantiated under the control of the application, as such:

```
const {FileOperations, FileOperationsCache, DirectoryCache, PathManager} = require('xtra-file-class');

const fops = new FileOperations(config)
let fs_promise = fops
const fopsc = new FileOperationsCache(config)
cons dirc = new DirectoryCache(config)
cons path = new PathManager(config)

```


## working with the classes



An application can use either of the two classes foe file operations. A third class is available for transfering objects to and from files in particular directories.

For file operations, there are two classes. The developer just needs to keep in mind that one of the classes caches and the other doesn't. So, if the application wants things to just go to and from files without keeping things in memory, they application will just use **FileOperations**.

Here is an example for **FileOperations**:

```
const {FileOperations} = require('extra-file-class')

let conf = false
let fos = new FileOperations(conf)

async function useit() {
	let obj = {
		"gnarly" : "json",
		"thing" : "you want on disk"
	}
	await fos.output_json('./a/place/on/disk',obj)
}

```

The conf, configuration object, does not have to be there. But, it may contain a method or a path to a method that handles EMFILE events. 

Other events are suppressed, but, they are reported. Events such as EEXIST will be ignored if the method is attempting to create a directory. Usually the aim of creating a directory is to make sure that it is there and it is OK if it is there. Applications can use ***exists*** if there is a need to wipe a directory before creating it.

To set the EMFILE handler the configuration object may be as follows:

```
let conf = {
	"EMFILE_handler" : "./path/to/node/module/"
}
```


Or, it may be a class instance with a **defer** method:

```
let conf = {
	"EMFILE_handler" : { defer : (callback) => {} } 
}
```

The error handler of affected methods will attempt to make a delayed recursion on their parameters. For instance, **dir\_remover** makes the following logic available when catching the error:

```
if ( this.EMFILE_handler ) {
    let self = this
    this.EMFILE_handler.defer(() => { return self.dir_remover(upath,recursive,force) })
}

```


**FileOperationsCache** may use the same configuration, but also it may have other parameters with respect to caching. The added parameters are the following:

* sync\_delta
* cache\_table

The application may decide not to mention these, in which case the defaults will be used.

**sync\_delta** is delta time parameter for an interval timer that puts objects to disk when the interval expires. The following is the default:

```
DEFAULT_SYNC_DELTA_TIME = 30000
```

**cache\_table** names a class or provides a path to a node module that implements a caching class. The default class *DefaultCacheTable*, is implemented in a small class definition using JavaScript data structure. Application may want to supply a more robust and efficient version that is not dependent on JavaScript memory managment.

Here is an example usage for **FileOperationsCache** :


```
const {FileOperationsCache} = require('extra-file-class')

let conf = {
	"sync_delta" : 120000,
	"cache_table" : "./path/to/my/cache/table/class/implementation.js"
}

let fosc = new FileOperationsCache(conf)

async useit() {
	let obj = {
		"gnarly" : "json",
		"thing" : "you want on disk"
	}
	await fosc.output_json('./a/place/on/disk',obj)
	//
	obj.thing = "should remain in cache, too."
	obj.add_field = "Because it JS and I can."
	fosc.update_at_path('./a/place/on/disk')  // and wait a while .. will be on disk
	let obj2 = fosc.load_json_data_at_path('./a/place/on/disk')
	assert(compare(obj,obj2))  // or whatever test syntax... should be the same
}

```


Take note that the object retrieved from cache may not actually be the exact same one that was put into cache. This depends on the implementation of the CacheTable class. It is also possible, that if the app closes down files, then retrieving an object from cache may get the object from a file anew.

The cache is not an LRU. It exists to get data in and out of files and keep it in memory. So, it is good for going between runs similar to a database. An application can certainly make an LRU by making calls to remove objects from memory tables at certain intervals. Then, later path accesses will be restored as cache misses, provided the file are still on disk.

The method, **\_file\_remover\_cache(path)**, which is not described below will remove a file from cache without removing the file from disk.

**DirectoryCache** is a third class that can be used to move objects to and from files disk in particular directories. The class **DirectoryCache** uses either of the file operations classes, with the default being the one that does not cache.

Here is an example using **DirectoryCache**:

```
let conf = was_passed_in
//
let dir_fos = new DirectoryCache({
        "default_firectory" : dirpath,   // a default top level directory op relative to it
        "object_list" : my_iterable,
        "file_namer" : (obj) => { return obj.name },  // app specific returns a string
        "noisy"  : (conf && conf.noisy_files) ? true : false,
        "crash_cant_load" : (conf && conf.crash_program_on_failing_load_from_cache) ? true : false,
        "use_caching" : false,		// if true, then use FileOpsCache
        "backup_interval" : (conf && conf.backup_interval) ? conf.backup_interval : false
    })
    
 async directory_ops() {
 	//
 	let item_injector = (obj) => { my_iterable.add(obj)  } // or push
 	// loads all files in a directory, parses them and then
 	// passes them into the item injector
 	await dir_fos.load_directory('things',this.item_injector)
 	//
 	let fos = dir_fos.get_fos() // get the file operations object the dir cache is using
 	// do fos ops ....
 	// ...
 	// then
 	await dir_fos.backup_to_directory()   // use configured values
 }
 
 
 directory_ops()
    

```

**PathManager**


<a name="access-fs" > </a>
### @= accessing node:fs and node:fs/promises

By a simple means of having the class constructor copy the top level fields of the `fs` and `fs/promises` classes, instances of FileOperations and FileOperationsCache can stand in for one of the node.js modules and provide another in a field. The choice made is to treat `fs/promises` as if it were the parent class of FileOperations, extended by FileOperationsCache. And, the field `fs` has been added to the instance object. (This is done during instance construction.)

For example, the following program will run:

```
const {FileOperations} = require('extra-file-class')

let conf = false
let fos = new FileOperations(conf)

async useit() {
	let obj = {
		"gnarly" : "json",
		"thing" : "you want on disk"
	}
	await fos.writeFile('./a/place/on/disk',JSON.stringify(obj))
	let obj2 = JSON.parse(fos.fs.readFileSync('./a/place/on/disk').toString())
	console.dir(obj2)
}

```




## Methods - FileOperations

* **dir\_maker**
* **dir\_remover**
* **file\_remover**
* **write\_out\_string**
* **write\_append\_string**
* **data\_reader**
* **json\_data\_reader**
* **file\_copier**
* **file\_mover**
* **ensured\_file\_mover**
* **ensure\_directories**
* **exists**
* **write\_out\_json**
* **load\_data\_at\_path**
* **load\_json\_data\_at\_path**
* **output\_string**
* **output\_append\_string**
* **output\_json**

## Methods - FileOperationsCache

When the FileOperationsCache class is used by the application, the methods of FileOperations remain in affectm, but they will perform caching operations. The methods listed below are either the overrides of above methods or they are added in relation to keeping objects in memory.

The methods, overriden, will be called by methods listed above. For example, **output\_json** will make a call to **write\_out\_json**.

* **dir\_maker**
* **dir\_remover**
* **file\_entry\_maker**
* **file\_remover**
* **file\_copier**
* **exists**
* **write\_out\_string**
* **write\_out\_json**
* **load\_json\_data\_at\_path**
* **update\_at\_path**
* **synch\_files**
* **stop\_sync**


<hr/>

## Method Details - FileOperations

#### **`dir_maker`**

create a directory -- assume parent directory exists -- guards against THROW
		
**parameters**

* path -- a path to the directory to be created
* options -- an object options object, for fsPromises.mkdir



#### **`dir_remover`**
remove a directory -- assume parent directory exists --guards against THROW

**parameters**

* upath -- a path to the directory to be remover
* recursive -- from fsPromises 'rm' -- will remove subdirectories if true
* force     -- from fsPromises 'rm' -- will remove directories and override stoppage conditions if true



#### **`file_remover`**

remove a file -- assume a valid path -- guards against THROW

**parameters**

* path -- a path to the file to be removed



#### **`write_out_string`**
write string to file -- assume a valid path
   -- guards against THROW

**parameters**

* path -- a path to the file that will contain the string
* str -- a string to be written
* ce\_flags  -- options -- refer to the flags for node.js writeFile 




#### **`write_append_string`**
append string to the end of a file -- assume a valid path -- guards against THROW

**parameters**

* path -- a path to the file that will contain the string
* str -- a string to be written
* ce\_flags  -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.




#### **`data_reader`**
read a file from disk  any format  -- will THROW

**parameters**

* path -- a path to the file that contains the string to be read




#### **`json_data_reader`**
read a JSON formatted file from disk -- will THROW

**parameters**

* path -- a path to the file that contains the string to be read




#### **`file_copier`**
copy a file from path\_1 to path\_2 -- assume valid paths -- guards against THROW

**parameters**

* path\_1 -- source path
* path\_2 -- destination path



#### **`ensured_file_copier`**
move a file from path\_1 to path\_2 -- assume valid paths for the source -- guards against THROW

> **ensured\_file\_copier**  calls **file\_copier** after calling **ensure\_directories** applied to path\_2.

**parameters**

* path\_1 -- source path
* path\_2 -- destination path



#### **`file_mover `**
move a file from path\_1 to path\_2 -- assume valid paths -- guards against THROW

> **file\_mover** calls **file\_copier** and then removes the source file after the copy is successful.

**parameters**

* path\_1 -- source path
* path\_2 -- destination path



#### **`ensured_file_mover `**
move a file from path\_1 to path\_2 -- assume valid paths for the source -- guards against THROW

> **ensured\_file\_mover**  calls **ensured\_file\_copier** and then removes the source file after the copy is successful.

**parameters**

* path\_1 -- source path
* path\_2 -- destination path




#### **`ensure_directories`**
attempts to construct or verify all directories along the path -- guards against THROW

**parameters**

* path -- a path to be construted or verified
* top\_dir -- **optional** -- top level directy path under which 
* is\_file\_path -- if true, this will call the callback on the basename.
* app\_cb(parent\_path,file\_path) -- a callback that can be used to place the file_path into the final parent directory in a cache table or for other application reasons.




#### **`exists`**
wraps the access method -- assumes the path is a valid path  -- guards against THROW

**parameters**

* path --  a path to the file under test




#### **`write_out_json`**
write string to file -- assume a valid path -- guards against THROW

**parameters**

* path -- a path to the file that will contain the string in JSON format
* obj -- a JSON stringifiable object
* ce\_flags  -- options -- refer to the flags for node.js writeFile 




#### **`load_data_at_path`**
read a file from disk  any format -- guards against THROW

**parameters**

* path -- a path to the file that contains the string to be read





#### **`load_json_data_at_path`**
read a JSON formatted file from disk -- guards against THROW

**parameters**

* path -- a path to the file that contains the string to be read


    

#### **`output_string`**
write string to file -- ensures path -- guards against THROW

**parameters**

* path -- a path to the file that will contain the string
* str -- a string to be written
* ce\_flags  -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
* top\_dir -- **optional** -- top level directy path under which 




#### **`output_append_string`**
append string to the end of a file -- assume a valid path -- guards against THROW

**parameters**

* path -- a path to the file that will contain the string
* str -- a string to be written
* ce\_flags  -- **optional** -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
* top\_dir -- optional as starting point for the directory




#### **`output_json`**
write string to file -- assume a valid path -- guards against THROW

**parameters**

* path -- a path to the file that will contain the string
* obj -- a JSON stringifiable object
* ce\_flags  -- **optional** -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
* top\_dir -- optional as starting point for the directory

## Method Details - FileOperationsCache


#### **`dir_maker`**

create a directory -- adds a directory to the cache table, then calls FileOperations`dir_maker`.
		
**parameters**

* path -- a path to the directory to be created




#### **`dir_remover`**
remove a directory -- removes the directory from the cache table, then calls the FileOperations `dir_remover`.

**parameters**

* upath -- a path to the directory to be remover
* recursive -- from fsPromises 'rm' -- will remove subdirectories if true
* force     -- from fsPromises 'rm' -- will remove directories and override stoppage conditions if true




#### **`ensure_directories`**
calls the FileOperations`ensure_directories` with callback provided that the last object is a file. The file will be added to the directory containing the file in the cache table.

**parameters**

* path -- a path to be construted or verified
* top\_dir -- **optional** -- top level directy path under which 
* is\_file\_path -- tells the method if a path to a file or directory is being passed. True if it is a file. Does not expect the method to figure this out




#### **`file_remover`**

remove a file -- first removes the file from the cache table, then calls FileOperations `file_remover`

**parameters**

* path -- a path to the file to be removed




#### **`file_copier`**
Clones a copy of the data in the hash table under the new path. Then, calls FileOperations `file_copier`

**parameters**

* path\_1 -- source path
* path\_2 -- destination path




#### **`exists`**
Check both the actual disk and the cache table. Returns true if it exists in both.

**parameters**

* path --  a path to the file under test




#### **`write_out_string`**
makes sure that the cache table entry for the file has its data set to the string. Then, it calls FileOperations `write_out_string`

**parameters**

* path -- a path to the file that will contain the string
* str -- a string to be written
* ce\_flags  -- options -- refer to the flags for node.js writeFile 




#### **`write_out_json`**
makes sure that the cache table entry for the file has its data set to the obj being written to the file as JSON. Then, it calls FileOperations `write_out_json`

**parameters**

* path -- a path to the file that will contain the string in JSON format
* obj -- a JSON stringifiable object
* ce\_flags  -- options -- refer to the flags for node.js writeFile 




#### **`load_json_data_at_path`**
If the file data is in cache, the data stored there will be returned. OTherwise, it assumes there is a cache miss and the FileOperations will be used to load the data from disk. After it is loaded from disk, it will be in cache.

**parameters**

* path -- a path to the file that contains the string to be read
       



#### **`update_json_at_path`**

Mark a file CacheTable as changed. This method allows for calling this independently of writing to a file. The file will be updated at the syncing interval if no write operation is performed before. (This allows for changing data structures in an application frequently without having a disk operation at each change.)

**parameters**

* path -- a path to the file that contains the string to be read




#### **`startup_sync(delta_time)`**

This starts the synching interval to fire at the `delta_time`. This method is called during construction, using the configuration. It may be called by the application however. 

#### **`stop_sync()`**

Turns off the synching interval. 

 
## A CacheTable interface

The FileOperationsCache class operates with a cache table class of a known interface. Here is the list of methods that CacheTable classes will need to implement in order to replace the default cache table.

* **constructor(conf)**
* **init**
* **add\_dir**
* **remove\_dir**
* **add\_file\_to\_dir**
* **contains**
* **contains\_file**
* **file\_data**
* **set\_file\_data**
* **all\_changed\_files**
* **mark\_changed**
* **clone\_file**

The **constructor** takes a configuration object. This is not used in the default class implementation. But, it is passed nevertheless, and may be useful to a prefered alternate.

The class is assumed to do no operations on disk. Although, some implementations may choose to.

#### **`init`**
 
The initializer for FileOperationsCache will await this method and must be provided even if empty.



#### **`add_dir`**

Adds an empty object to a map `<directory path,objec>`. The object will contain path entries contained in the directory.

**parameters**

* path -- a path to the directory -- becomes the default key in the table.



#### **`remove_dir`**

Remove the directory structure from the cache table. If it is not forced, the presence of file will preclude the completion of the task. Works recursively if asked. 

**parameters**

* path -- a path to the directory 
* recursive -- removes subdirectories
* force  -- removes files 




#### **`add_file_to_dir`**

Add a file to the object mapped to by the directory path given. This should be the parent directory of the file. (Does not have to be -- but that may be problematic to some applications.) Only adds the file if the directory has been added already.

**parameters**

* parent\_path -- should be the parent path of the file.
* file -- the full path of the file. This path is used for synching data.




#### **`add_file`**

Puts the file into directory tables and the file table.

Create an object in the file map table of the following form:

```
{
    "data" : false,
    "flags" : {},
    "is_structured" : false,
    "changed" : false,
    "key" : false,
    "path" : path
}
```

This form is considered empty. And, more should be done to populate the field values.

**parameters**

* path -- a path to the file as it occurs on disk.




#### **`contains`**

Returns true if the provided path is either a directory or a file stored in the cache table.

**parameters**

* path -- a path to the file as it occurs on disk.




#### **`contains_file`**

Returns true or a key if the file is in the file table. Returns a key if keys are being used by the implementation. Otherwise, returns **false**.

**parameters**

* path -- a path to the file as it occurs on disk.




#### **`file_data`**

Returns the data field of a file table entry.

**parameters**

* path -- a path to the file as it occurs on disk.
* fkey -- can only be used if the class is configured to use keys




#### **`set_file_data`**

The file must have been placed in cache. Sets new data. Marks the object as changed.

```
    set_file_data(path,obj,ce_flags,is_structured) {
        let file_o = this.file_caches[path]
        if ( file_o ) {
            file_o.data = obj
            file_o.flags = ce_flags
            file_o.is_structured = is_structured
            file_o.changed = true
        }
    }
```

**parameters**

* path -- a path to the file as it occurs on disk.
* obj -- an object to be stored - may be a string.
* is\_structured -- indicates the object is an object and not a string if true.



#### **`all_changed_files`**

Returns all changed files as a list of file objects (see `add_file`). Called by the sync method.

**no parameters**




#### **`mark_changed`**

If a file is stored, indicates that it has been changed and should be written as sync or not

**parameters**

* path -- a path to the file as it occurs on disk.
* bval -- a boolean value. **true** to add it to the sync list, **false** to remove it.




#### **`clone_file`**

Clones (deep copy) the object stored in the data of `path_1` and puts it into the data of a new file entry in `path_2`.

**parameters**

* path\_1 -- a path to the file as it occurs on disk and will be the source of data
* path\_2 -- a path to the file as it occurs on disk and will be the destination of data



## DirectoryCache

The DirectoryCache class provides two methods to send objects to files in a directory and to load them again later. It may also provide interval based synching.

* **constructor(conf)**
* **load\_directory**
* **backup\_to\_directory**
* **get_fos**
* **stop**

The **constructor** takes a configuration object which defines defaults required for operation.  Here are the fields that should be in the configuration object:
	
1. **default\_directory**  -- a top level directory use when parameters do mention it
2. **file\_namer**	-- a function or a path to a module 
3. **object\_list**	-- an iterable shared by this class with the application
4. **use\_caching** -- if true, *FileOperationsCache* will be used instead of *FileOperations*
5. **noisy** -- report errors 
6. **crash\_cant\_load** -- if loading fails then exit the program
7. **backup\_interval** -- in miliseconds 
	


#### **load\_directory**
 
Locates a directory and then loads all of its files, expecting them to contain JSON objects. Calls on JSON parsing.


**parameters**

* path -- a path to the directory, which will be below the default directory
* item\_injector -- a one parameter function, where the parameter should be a parsed JSON object from one of the files.
* base\_dir -- (optional) -- if specified, this is the top level directory instead of the configured one.
* after_action -- (optional) -- a function to call after loading.



#### **backup\_to\_directory**

Write a list of objects to files, named by the file namer function, configured. All files are written to the base directory if specified or to the default base directory, configured.

**parameters**

* file\_namer -- (optional) -- a one parameter function that takes an object from the list nad figured a name for it. If not specified, the default, configured, is used.
* base\_dir -- (optinal) -- if specified, this is the top level directory instead of the configured one.
* list -- (optional) -- an iterable of objects to write to files. If not specified, this method attempts to use the configured iterable.
* ce\_flags -- (optional) -- the flags to be passed to `write_json_string`



#### **get\_fos**

Return the reference to the file operations object that this DirectoryCache object is using.




#### **stop**

Turn off the backup interval. 



#### **start**

Turn on the backup interval with delta time passed to it.

**parameters**

* b\_interval --  The delta time between calls to **backup\_to\_directory**



