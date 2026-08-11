const fs = require('fs');

let serverTs = fs.readFileSync('server.ts', 'utf8');
serverTs = serverTs.replace("import sqlite3 from 'sqlite3';", "import { DatabaseSync } from 'node:sqlite';");

fs.writeFileSync('server.ts', serverTs);
