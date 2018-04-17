JSON2SQL
---
A generalized way of ingesting *any* JSON files (where every line is a JSON object) into structured tables in relational databases (MySQL, Postgres). It also cleans up dirty data and validates data types, so you'll still get a clean import no matter how spotty or irregular the data is.

It can ingest even large files (10G+) in a reasonable time - much faster than having to *properly* ingest it through a NoSQL store! Instead, this program converts your JSON files into a validated, structured CSV, with proper columns and data types, and lets your database ingest them extremely quickly via either `LOAD DATA INFILE` in *MySQL* or `COPY` in *Postgres*.

Not only is it faster to ingest data this way, but giving structure to data also makes it easier to work with, as you can utilize the power of *SQL* to query against your data. It is also much faster to transform your data in relational databases and to run anything that needs *JOINs*.

#### A note about column types
Because it tries to match as many values as possible, it picks the broadest data type fitting each column. Thus, any integer - regardless of length - will be cast to `INT`, floats to `DOUBLE`, booleans to `BOOL`, and string to `TEXT`. This generalization gives the user the flexibility to convert the column types as they see fit after ingesting data.

### Usage

As I use https://www.npmjs.com/package/minimist to parse the inputs, use the parameter format specified by the library when passing in arguments on command line.

Example:
`yarn start --dialect=MySQL --database=myDB --password=plaintext $FILE1 $FILE2 ...`

Note that a lot of the paramters have sensible defaults:

- `dialect`: postgres
- `host`: localhost
- `port`: the default port of your `dialect`
- `database` and `username`: your computer username
- `password`: none
- `limit`: 1000 (how many lines to explore before locking onto the schema - increase if you have some columns that *very* rarely have a non-null value)