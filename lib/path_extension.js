
const { fail } = require('assert')
const path = require('path')
const untildify = require('untildify').default


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
                    this.compile_paths(this._path_abreviations,conf.vars)
                } else {
                    this.compile_paths(this._path_abreviations)
                }
            }
        }
        //
    }


    path_abreviations() {
        return this._path_abreviations
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
     * @param {string} clean_key 
     * @param {object} conf 
     * 
     * @returns string
     */
    translate_marker(clean_key,conf) {
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
                        clean_key = this.translate_marker(clean_key,conf)
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
     *  let pobj = {"path_abreviations" : {
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
        }},

        compile_paths(pobj,vars)

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


    // prefilter
    // globs

}




module.exports = PathManager