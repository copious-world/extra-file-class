# extra-file-class
 A node.js file operations class with methods wrapping fs/promises



## Methods

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

<hr/>

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
