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

  <a href="https://www.npmjs.com/package/extra-file-class" target="_blank" ><span style="font-weight:bold;">&#8594;</span> find his package on npm</a>


## Documentation

The documentation for methods been moved from the README.md file to pages formatted by JSDOC. The may be found at
the following link:

  <a href="https://www.copious.world/docs" target="_blank" ><span style="font-weight:bold;">&#8594;</span> extra-file-class documentation</a>

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

fs/promises can be passed out without any of the module additions:

```
const fs_cache = require('extra-file-class')('promises')
```
> In the above, the parameter is just different than 'dropin' or 'cache' or nothing. Any string that is not those will suffice.

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

For file operations, there are two classes. The developer just needs to keep in mind that one of the classes caches and the other doesn't. So, if the application requires things to just go to and from files without keeping things in memory, the application will just use **FileOperations**. Otherwise, it will require **FileOperationsCache**.

An application can use either of the two classes for file operations. A third class is available for transfering objects to and from files in particular directories, **DirectoryCache**. 

The fourth class, **PathManager**, was added in the last version. 

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

In the above example, the conf, configuration object, does not have to be there. But, it may contain a method or a path to a method that handles EMFILE events.

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

The PathManager class provides methods that help with a table of abbreviations that an application may use to shorten file specification in custom scripts.


<a name="access-fs" > </a>
### accessing node:fs and node:fs/promises

By a simple means of having the class constructor copy the top level fields of the `fs` and `fs/promises` classes, instances of FileOperations and FileOperationsCache can stand in for one of the node.js modules and provide another in a field. The choice made is to treat `fs/promises` as if it were the parent class of FileOperations, extended by FileOperationsCache. And, the field `fs` has been added to the instance object. (This is done during instance construction.)

For example, the following program will run:

```
const {FileOperations} = require('extra-file-class')

let conf = false
let fos = new FileOperations(conf)
update_at_path
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
