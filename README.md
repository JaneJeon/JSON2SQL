JSON2SQL
---
Ingest JSON files (where every line is a JSON object) into structured tables in relational databases (MySQL, Postgres).

It can ingest even large files (10G+) in a reasonable time - so much faster than having to *properly* ingest it through a NoSQL store! Instead, this program converts your JSON files into a structured CSV, with proper columns and data types, and lets your database ingest them extremely quickly via either `LOAD DATA INFILE` in *MySQL* or `COPY` in *Postgres*.

Not only is it faster to ingest data this way, but giving structure to data also makes it easier to work with, as you can utilize the power of *SQL* to query against your data. It is also much faster to transform your data in relational databases and to run anything that needs *JOINs*.

### Usage

As I use https://www.npmjs.com/package/minimist to parse the inputs, use the parameter format specified by the library.

Example:
`yarn start --dialect=MySQL --database=myDB --password=plaintext $FILE1 $FILE2 ...`

Note that a lot of the paramters have sensible defaults:

- `dialect`: postgres
- `host`: localhost
- `port`: the default port of your `dialect`
- `database` and `username`: your computer username
- `password`: none