# extra-file-class

A node.js file operations class with methods wrapping fs/promises

This module provides two classes with methods that make some file operations simple to use.

The first classes provide simple wrappers. While the second class provides wrappers that also keep data in memory under the aegis of a caching object. The caching object may be configured. 

## install 

```
npm install --save extra-file-class
```

## usage

An application can use either of the two classes. The developer just needs to keep in mind that one of the classes caches and the other doesn't. So, if the application wants things to just go to and from files without keeping things in memory, they application will just use **FileOperations**. 

Here is an example for **FileOperations**:

```
const {FileOperations} = require('extra-file-class')

let conf = false
let fos = new FileOperations(conf)

async useit() {
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


## Methods - FileOperations

* **dir\_maker**
* **dir\_remover**
* **file\_remover**
* **write\_out\_string**
* **write\_append\_string**
* **data\_reader**
* **json\_data\_reader**
* **file\_copier**
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

#### <u>**dir\_maker**</u>


create a directory -- assume parent directory exists -- guards against THROW
		
**parameters**

* path -- a path to the directory to be created


#### <u>**dir\_remover**</u>
remove a directory -- assume parent directory exists --guards against THROW

**parameters**

* upath -- a path to the directory to be remover
* recursive -- from fsPromises 'rm' -- will remove subdirectories if true
* force     -- from fsPromises 'rm' -- will remove directories and override stoppage conditions if true

#### <u>**file\_remover**</u>

remove a file -- assume a valid path -- guards against THROW

**parameters**

* path -- a path to the file to be removed


#### <u>**write\_out\_string**</u>
write string to file -- assume a valid path
   -- guards against THROW

**parameters**

* path -- a path to the file that will contain the string
* str -- a string to be written
* ce_flags  -- options -- refer to the flags for node.js writeFile 


#### <u>**write\_append\_string**</u>
append string to the end of a file -- assume a valid path -- guards against THROW

**parameters**

* path -- a path to the file that will contain the string
* str -- a string to be written
* ce_flags  -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.

#### <u>**data\_reader**</u>
read a file from disk --- any format  -- will THROW

**parameters**

* path -- a path to the file that contains the string to be read


#### <u>**json\_data\_reader**</u>
read a JSON formatted file from disk -- will THROW

**parameters**

* path -- a path to the file that contains the string to be read



#### <u>**file\_copier**</u>
copy a file from path_1 to path_2 -- assume valid paths -- guards against THROW

**parameters**

* path_1 -- source path
* path_2 -- destination path


#### <u>**ensure\_directories**</u>
attempts to construct or verify all directories along the path -- guards against THROW

**parameters**

* path -- a path to be construted or verified
* top_dir -- **optional** -- top level directy path under which 


#### <u>**exists**</u>
wraps the access method -- assumes the path is a valid path  -- guards against THROW

**parameters**

* path --  a path to the file under test

#### <u>**write\_out\_json**</u>
write string to file -- assume a valid path -- guards against THROW

**parameters**

* path -- a path to the file that will contain the string in JSON format
* obj -- a JSON stringifiable object
* ce_flags  -- options -- refer to the flags for node.js writeFile 


#### <u>**load\_data\_at\_path**</u>
read a file from disk --- any format -- guards against THROW

**parameters**

* path -- a path to the file that contains the string to be read



#### <u>**load\_json\_data\_at\_path**</u>
read a JSON formatted file from disk -- guards against THROW

**parameters**

* path -- a path to the file that contains the string to be read
          

#### <u>**output\_string**</u>
write string to file -- ensures path -- guards against THROW

**parameters**

* path -- a path to the file that will contain the string
* str -- a string to be written
* ce_flags  -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
* top_dir -- **optional** -- top level directy path under which 


#### <u>**output\_append\_string**</u>
append string to the end of a file -- assume a valid path -- guards against THROW

**parameters**

* path -- a path to the file that will contain the string
* str -- a string to be written
* ce_flags  -- **optional** -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
* top_dir -- optional as starting point for the directory

#### <u>**output\_json**</u>
write string to file -- assume a valid path -- guards against THROW

**parameters**

* path -- a path to the file that will contain the string
* obj -- a JSON stringifiable object
* ce_flags  -- **optional** -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
* top_dir -- optional as starting point for the directory

## Method Details - FileOperationsCache


