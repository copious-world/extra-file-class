
const { fail } = require('assert')
const path = require('path')
const untildify = require('untildify').default

const crypto = require('crypto')

function hash_it(path_tmpl) {
    let output =crypto.hash(path_tmpl)
    return output
}

/**
 * PathManager
 * 
 * Fields of Conf:
 * 
 * * path_abreviations -- these are use to compile path names to relative and obsolute paths.
 * 
 * This module mix the node.js path module with class instances.
 * 
 */

class PathManager {

    /**
     * constructor
     * 
     * Initializes path abbreviations to an empty object for mapping.
     * 
     * This uses the JavaScript object rather than the map class 
     * 
     * @param {object} conf 
     */
    constructor(conf) {
        //
        this._path_abreviations = {}
        //
        Object.assign(this,path)
        if ( typeof conf === 'object' ) {
            if ( typeof conf.path_abreviations === 'object' ) {
                this._path_abreviations = Object.assign({},conf.path_abreviations)
                if ( typeof conf.vars === 'object' ) {
                    this._vars = Object.assign({},conf.vars)
                    this.compile_paths(this._path_abreviations,this._vars)
                } else {
                    this.compile_paths(this._path_abreviations)
                }
            }
        }
        //
    }

    /**
     * path_abreviations
     * 
     * This returns the abbreviations in the state that they are in. 
     * If the application has not made path_abbreviations and vars available to the 
     * constructor via conf, the configuration object, then the map will still have
     * its initial form or be empty. 
     * 
     * Otherwise, assuming no errors in compilation, the fully resolved paths will be returns 
     * as the values of the map, where a path abbreviation is the key.
     * 
     * @returns object -- the final path resulotion map after compilation
     */
    path_abreviations() {
        return this._path_abreviations
    }

    /**
     * path_vars
     * 
     * Returns the map of variable to values
     * 
     * @returns object
     */

    path_vars() {
        return this._vars
    }


    get_path(abbreviation) {
        if ( typeof abbreviation === "string" ) {
            return this._path_abreviations[abbreviation]
        }
        return undefined
    }

    /**
     * set_var
     * 
     * updates or adds a key,value pair to the variables
     * And, ths variable will be usable in ensuing evaluations
     * 
     * @param {string} a_var 
     * @param {string} a_val 
     */
    set_var(a_var,a_val) {
        if ( ( typeof a_var === "string" ) && ( typeof a_val === "string" ) ) {
            this._vars[a_var] = a_val
        }
    }


    /** 
     * get_var
     * 
     * returns the string mapped by the variable or else it returns undefined
     * 
     * @return string
    */
    get_var(a_var) {
        if ( typeof a_var === "string" ) {
            return this._vars[a_var]
        }
        return undefined
    }


    /**
     * pop_dir
     * 
     * one directory higher up
     * 
     * @param {string} where_am_i 
     * @returns string
     */
    pop_dir(where_am_i) {
        let sep = path.sep
        let last_dir = where_am_i.lastIndexOf(sep)
        if ( last_dir > 0 ) {
            where_am_i = where_am_i.substring(0,last_dir)
        }
        return where_am_i
    }


    /**
     * default_realtive_asset_dir
     * 
     * one directory up from the module lib director
     * returns this location as a string
     * 
     * @returns string
     */
    default_realtive_asset_dir() {
        let where_am_i = __dirname
        let default_dir = this.pop_dir(where_am_i)
        return default_dir
    }


    /**
     * translate_marker
     * 
     * This is basically just substitution, 
     * but it looks at the path of the string that is being cleaned up.
     * 
     * Puts abbreviations mapped values in place of abbreviations, otherwise it 
     * figures an absolute path.
     * 
     * If a marker is replaced with a string containing markers, this method will recurse.
     * To avoid infinite recursion, the map and the data have to be safe. This does not 
     * track inifite recurskon. 
     * 
     * If the clean key is the string 'default', this will return the working directory.
     * 
     * 
     * @param {string} clean_key
     * 
     * @returns string
     */
    translate_marker(clean_key) {
        if ( clean_key === "default" ) {
            clean_key = this.default_realtive_asset_dir()
        } else {
            let syntax_boundary = clean_key.indexOf(']')
            if ( syntax_boundary > 0 ) {
                let location_marker = clean_key.substring(0,syntax_boundary+1)
                let findable = this._path_abreviations[location_marker]
                if ( findable ) {
                    clean_key = clean_key.replace(location_marker,findable).trim()
                    if ( clean_key[0] === '[' ) {
                        clean_key = this.translate_marker(clean_key)
                    } else if ( clean_key[0] === '~' ) {
                        clean_key = untildify(clean_key)
                    } else if ( clean_key[0] === '.' ) {
                        clean_key = path.resolve(clean_key)
                    }
                }
            }
        }
        return clean_key
    }


    /**
     * extract_delimited
     * 
     * Returns a list of variables found in the input with the delimiters affixed to their content.
     * That is, the delimiters.prefix and suffix will start and end a set of characters
     * which can be used as an identifier in some programming language or other.
     * 
     * For example: a string such as "This is ${some} test or ${other}" will result in ["${some}", "${other}"]
     * where `del` is '${' and stopper is '}'.
     * 
     * Another example:  a string such as "This is [some] test or [other]" ]will result in ["[some]", "[other]"]
     * where `del` is '[' and stopper is ']'.
     * 
     * @param {string} str 
     * @param {string} del 
     * @param {string} stopper 
     * @returns Array
     */
    extract_delimited(str,del,stopper) {
        let vset = new Set()

        let n = str.length
        for ( let i = 0; i < n; i++ ) {
            let c = str[i]
            if ( c == del[0] && (del.length === 2 ? str[i+1] === del[1] : true) ) {
                if( del.length === 2 ) { i++ }
                let a_var = del
                while ( i < n ) {
                    i++
                    let c = str[i]
                    if ( (c !== ' ') && ( c !== '\t' ) ) {
                        a_var += c
                    }
                    if ( c === stopper ) break;
                }
                a_var = a_var.trim()
                try {
                    vset.add(a_var)
                } catch(e) {}
            }
        }

        let vars  = [ ... vset ]
        return vars
    }

 
    /**
     * extract_vars
     * 
     * @param {string} str 
     * 
     * @returns Array
     */
    extract_vars(str) {
        return this.extract_delimited(str,'${','}')
    }


    /**
     * extract_abbreviations
     * @param {string} str 
     * @returns Array
     */
    extract_abbreviations(str) {
        return this.extract_delimited(str,'[',']')
    }


    /**
     * subst_vars
     * 
     * @param {string} str 
     * @param {object} subr_vars 
     * @param {object} vars_values 
     * @returns string
     */
    subst_vars(str,subr_vars,vars_values) {
        //
        let fails = 0
        for ( let a_var of subr_vars ) {
            let val = vars_values[a_var]
            if ( val !== undefined ) {
                while ( str.indexOf(a_var) >= 0 ) {
                    str = str.replace(a_var,val)
                }
            } else fails++
        }
        //
        return [str,fails]
    }

    /**
     * compile_paths
     * 
     * 
     * Example input
     * 
```
let path_abreviations = {
    "[websites]" : "[alphas]/websites",
    "[alphas]" : "[github]/alphas",
    "[alpha-copious]" : "[github]/alphas/alpha-copious",
    "[github]" : "~/Documents/GitHub",
    "[locals]" : "./stuff/[friends]",
    "[sibling]" : "../something",
    "[aunt]" : "../../${aunt}",
    "[uncle]" : "../../${uncle}",
    "[redef]" : "/home/buddies/",
    "[tricky]" : "[redef]/[aunt]/specials"
}

let vars = {
    "${aunt}" : "tia maria",
    "${uncle}" : "tio bolo"
}

Compile_paths(pobj,vars)


```
     * 
     * @param {object} pobj
     * 
     * @returns boolean
     */

    compile_paths(pobj,subs) {

        //
        let path_abreviations = pobj
        //
        let vars = subs 
        if ( ( vars !== undefined ) && ( typeof pobj.vars === "object" ) ) {
            vars = pobj.vars
        }

        let abbrevs = Object.keys(path_abreviations)

        if ( vars ) {
            for ( let abrv of abbrevs ) {
                let subr = path_abreviations[abrv]
                if ( subr.indexOf("$") >= 0 ) {
                    let i = 0;
                    while ( (i < 20) && (subr.indexOf("$") >= 0) ) {
                        i++;
                        let subr_vars = this.extract_vars(subr)
                        let subr_o = this.subst_vars(subr,subr_vars,vars)
                        subr = subr_o[0]
                    }
                }
                path_abreviations[abrv] = subr
            }
        }

        let dble_dot = {}
        for ( let abrv of abbrevs ) {
            let subr = path_abreviations[abrv]
            //
            if ( subr.substring(0,2)  === '..' ) {
                dble_dot[abrv] = subr
            }
            //
        }
        //
        for ( let abrv of abbrevs ) {
            let subr = path_abreviations[abrv]
            //
            if ( subr.indexOf("[") >= 0 ) {
                let subr_abbrevs = this.extract_abbreviations(subr)
                let subr_o = this.subst_vars(subr,subr_abbrevs,dble_dot)
                subr = subr_o[0]
            }
            //
            path_abreviations[abrv] = subr.trim()
        }



        // now dots and tildas

        for ( let abrv of abbrevs ) {
            //
            let subr = path_abreviations[abrv]

            if ( subr[0] === '.' ) {  // relative path
                subr = path.resolve(subr)
            } else if ( subr[0] === '~' ) {
                subr = untildify(subr)
            }

            path_abreviations[abrv] = subr
            //
        }


        // ---- ---- ---- ---- ---- ---- ----
        //
        let expander_count = 0
        do {
            //
            expander_count = 0
            //
            for ( let abrv of abbrevs ) {
                let subr = path_abreviations[abrv]
                //
                if ( subr.indexOf("[") >= 0 ) {
                    let subr_abbrevs = this.extract_abbreviations(subr)
                    let subr_o = this.subst_vars(subr,subr_abbrevs,path_abreviations)
                    subr = subr_o[0]
                    let fails = subr_o[1]
                    if ( fails ) {
                        expander_count -= fails
                    }
                }
                //
                path_abreviations[abrv] = subr.trim()
                //
                if ( subr.indexOf("[") >= 0 ) {
                    expander_count++
                }
                //
            }
            //
        } while ( expander_count > 0 )


        for ( let abrv of abbrevs ) {
            let subr = path_abreviations[abrv]

            if ( subr.indexOf('..') > 0 ) {
                path_abreviations[abrv] = path.resolve(subr)
            }
        }

        return true
    }

    /**
     * compile_one_path
     * 
     * For applications that need it,
     * at any time after the orginal map has been compiled, a string with abbreviations and variabls in it 
     * can be compiled to an absolute path.
     * 
     * This method returns the compiled string and does not save the string as a map from any abbreviation to the string.
     * 
     * @param {string} path_tmpl 
     * @returns string
     */
    compile_one_path(path_tmpl) {
        let key = hash_it(path_tmpl)
        let pobj = Object.assign({},this._path_abreviations)
        let subs = Object.assign(this._vars)

        pobj[key] = path_tmpl

        this.compile_paths(pobj,subs)

        let result = pobj[key]
        //        
        return result
    }



    /**
     * add_abbreviation
     * 
     * Add an abbreviation to the paths in whatever state they are in.
     * Compile all the paths with the new abbreviation 
     * and the current set of variables
     * 
     * @param {string} abbreviation 
     * @param {string} path_template 
     */
    add_abbreviation(abbreviation,path_template) {
        if ( (typeof abbreviation === "string") && (typeof path_template === "string") ) {
            this._path_abreviations[abbreviation] = path_template
            this.compile_paths(this._path_abreviations,this._vars)
        }
    }




    // prefilter
    // globs

}




module.exports = PathManager