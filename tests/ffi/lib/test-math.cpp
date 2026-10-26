// mathlib.c
#include <stdint.h>
#include <cstddef>
#include <cstdlib>
#include <cstdio>
#include <cstring>

extern "C" {
    int32_t add(int32_t a, int32_t b) {
        return a + b;
    }
}


static char *string_parameter_1 = NULL;

char **allocated = NULL;
uint count_allocated = 0;

extern "C" {
    void init_string_parameters() {
        string_parameter_1 = (char *)calloc(256,1);
        allocated = (char **)calloc(256,sizeof(char *));
    }

    char *munge_string(char *subject_string) {
        uint n = strlen(subject_string) + 2;
        char *output =  (char *)calloc(n,1);                        //strdup(subject_string);
        allocated[count_allocated++] = output;
        strcpy(output,subject_string);
        output[2] = 'A';
        output[4] = 'B';
        // printf("%s", output);
        return output;
    }

    void closing_ops() {
        free(string_parameter_1);
    }

    void clearout_allocated_strings() {
        for ( uint i = 0; i < count_allocated; i++ ) {
            if ( allocated[i] ) {
                free(allocated[i]);
                allocated[i] = (char*)(0L);
            }
        }
        count_allocated = 0;
    }
}

