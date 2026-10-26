
// gcc -shared -fPIC test-math.cpp -o libtestmathlib.so

const { DynamicLibrary, suffix, toString } = require('node:ffi');
const { homedir, userInfo } = require('node:os');
const { sep } = require('node:path');



const untildifylib = new DynamicLibrary(`./lib/libuntildifii.${suffix}`);

const untildify_ffi = untildifylib.getFunction('untildify', {
    arguments: [ 'string', "uint16", 'string', "uint16", 'char' ],
    return: 'string'
});

// remove_user_name(char *path, char *username, uint16_t slen, u_char sep)
const remove_user_name_ffi = untildifylib.getFunction('remove_user_name', {
    arguments: [ 'string', 'string', "uint16", 'char' ],
    return: 'string'
});

const sep8 = Buffer.from(sep).readUInt8(0);
const homeDirectory = homedir();
const hdr_len = homeDirectory.length


function untildify(pathstr) {
    if (typeof pathstr !== 'string') {
	    console.log(`untildify: Expected a string, got ${typeof pathstr}`);
        return ""
	}

    let n = pathstr.length
    let sptr = untildify_ffi(homeDirectory,hdr_len,pathstr,n,sep8)

    if ( sptr !== 0n ) {
        let fullpath = "" + toString(sptr);
        return fullpath
    }

    return pathstr
}


function remove_user_name(pathstr) {
    let username = userInfo().username;
    let n = username.length
    let sptr = remove_user_name_ffi(pathstr,username,n,sep8)
    if ( sptr !== 0n ) {
        let path_wo_user = "" + toString(sptr);
        return path_wo_user
    }

    return pathstr
}



for ( let i = 0; i < 100; i++ ) {
    let s = untildify("~/GitHub/universal")
    console.log(s)

    s = untildify("~richard/GitHub")
    console.log(s)

    s = untildify("som junk")
    console.log(s)


    let p = remove_user_name("~richard/GitHub")
    console.log(p)
    console.log(untildify(p))

    p = remove_user_name("~richard/GitHub")
    console.log(p)
    console.log(untildify(p))

    p = remove_user_name("~//////richard/GitHub")
    console.log(p)
    console.log(untildify(p))

    p = remove_user_name("~joyboy/GitHub")
    console.log(p)
    console.log(untildify(p))
}




console.log(suffix)

const lib = new DynamicLibrary(`./lib/libtestmathlib.${suffix}`);


console.dir(lib)
console.log(lib.path)

console.dir(lib.functions)


const add = lib.getFunction('add', {
  arguments: ['int32', 'int32'],
  return: 'int32',
});

const init_string_parameters = lib.getFunction('init_string_parameters',{
    arguments: [],
    return: 'void'
})


const closing_ops = lib.getFunction('closing_ops',{
    arguments: [],
    return: 'void'
})

const clearout_allocated_strings = lib.getFunction('clearout_allocated_strings',{
    arguments: [],
    return: 'void'
})


const munge_string = lib.getFunction('munge_string',{
    arguments: ['string'],
    return: 'string'
})



init_string_parameters()

console.log(add(673, 27));
console.log(add.pointer);

let a = "this is a test"
console.log("the string starts as:",a)
let b = ""
let j = 40
while ( j-- > 0 ) {
    for ( let i = 0; i < 250; i++ ) {
        //let sptr =
        munge_string(a)
        //b = toString(sptr);
    }
    clearout_allocated_strings()
}

let sptr = munge_string(a)
b = toString(sptr);
console.log("the string is now:",b)


clearout_allocated_strings()
closing_ops()



