# gedcom-parser

Simple parser for [gedcom](https://en.wikipedia.org/wiki/GEDCOM) files.  
Advantage is in one loop processing a file what increase performance and extensibility of the base class allowing you to change the default data format.

##Installing:  
`npm install gedcom-parser`


##Default Usage:

- ###ES6 modules
```
// gedcom file - plain text format
import gedcom from '001.ged';

import {GedcomParser} from 'gedcom-parser';

const gedcomParser = new GedcomParser(gedcom);

// parsed data presented
gedcomParser.data
```

- ###CommonJS
```
const gedcom = requare('001.ged');

const {GedcomParser} = requare('gedcom-parser');

const gedcomParser = new GedcomParser(gedcom);

// parsed data presented
gedcomParser.data
```

##Output 
```
{
  "@I1@": {
    "_UID": "1K6bUQd8du",
    "NAME": "Ivan Ivanivich /Ivanov/",
    "GIVN": "Ivan Ivanivich",
    "SEX": "M",
    "OCCU": "Engineer",
    "BIRT": {
      "DATE": "1 JAN 1980"
    },
    "FAMC": "@F10@",
    "EDUC": {
      "DATE": "FROM 2000 TO 2005",
      "PLAC": "Moscow"
    },
    "CHR": "",
    "ASSO": "@I567@",
    "RELA": "Godmother",
    "RESI": "",
    "FAMS": [
      "@F103@"
    ],
    "OBJE": "",
    "_PRIM": "Y"
  },
  ...restElems
}