// mathlib.c
#include <stdint.h>
#include <cstddef>
#include <cstdlib>
#include <cstdio>
#include <cstring>



static char *string_parameter_1 = NULL;

#define SCRATCH_SIZE 4096
char scratch[SCRATCH_SIZE] = {0};

extern "C" {

    char *untildify(char *prefix, uint16_t plen, char *pathstr, uint16_t slen, u_char sep) {
        if ( slen > 0 ) {
            if ( pathstr[0] == '~' ) {
                uint8_t advance = 1;
                u_char c = pathstr[1];
                if ( c == sep ) {
                    advance = 0;
                }
                uint n = plen + slen + 2;
                char *output =  &scratch[0];                        //strdup(subject_string);
                strcpy(output,prefix);
                if ( advance ) {
                    output[plen] = sep;
                    output[plen+1] = 0;
                }
                strcat(output,pathstr + 1);
                return output;
            }
        }
        return (char *)NULL;
    }

    char *remove_user_name(char *path, char *username, uint16_t slen, u_char sep) {
        char *tmp = path;
        while ( *tmp && (tmp[0] == '~') ) { tmp++; }
        while ( *tmp && (tmp[0] == sep) ) { tmp++; }
        char *utmp = username;
        while ( *tmp && *utmp ) {
            if ( tmp[0] != utmp[0] ) {
                break;
            }
            tmp++; utmp++;
        }
        if ( !(*utmp) ) {
            char *output = &scratch[0];
            output[0] = '~';
            strcpy(output+1,tmp);
            return output;
        }
        return (char *)NULL;
    }

}

