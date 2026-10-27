
// gcc -shared -fPIC test-math.cpp -o libtestmathlib.so

const { DynamicLibrary, suffix, toString } = require('node:ffi');
const { homedir, userInfo } = require('node:os');
const { sep } = require('node:path');
const path = require('node:path')

const filePath = path.join(__dirname, 'lib', `libuntildifii.${suffix}`);
const untildifylib = new DynamicLibrary(filePath);

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

module.exports.untildify = untildify
module.exports.remove_user_name = remove_user_name
