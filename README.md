# JSON2SQL

[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=JaneJeon/JSON2SQL)](https://dependabot.com)

A generalized way of ingesting *any* JSON files (where every line is a JSON object) into structured tables in relational databases (MySQL, Postgres). It also cleans up dirty data and validates data types, so you'll still get a clean import no matter how spotty or irregular the data is.

It can ingest even large files (10G+) in a reasonable time - much faster than having to *properly* ingest it through a NoSQL store! Instead, this program converts your JSON files into a validated, structured CSV, with proper columns and data types, and lets your database ingest them extremely quickly via either `LOAD DATA INFILE` in *MySQL* or `COPY` in *Postgres*.

Not only is it faster to ingest data this way, but giving structure to data also makes it easier to work with, as you can utilize the power of *SQL* to query against your data. It is also much faster to transform your data in relational databases and to run anything that needs *JOINs*.

### Applications
You can do a one-time ingest of a big file for data analysis purposes. For example, I built this tool to ingest the [reddit comments data](http://files.pushshift.io/reddit/comments/) - which is formatted in JSON, and has errors and inconsistencies sprinkled throughout it - and run some SQL analytic queries against the data.

Another thing you could do once I implement ingesting of JSON data over HTTP is to make Filebeat watch any JSON logs and send over JSON data to this app, which will then ingest it into a SQL database. Even if the log is not JSON, Logstash, with its Grok plugin, can convert that into a stream of JSON objects, which can be routed to this app and then be ingested into a SQL store.

#### A Note About Column Types
Because it tries to match as many values as possible, it picks the broadest data type fitting each column. Thus, any integer - regardless of length - will be cast to `INT`, floats to `DOUBLE`, booleans to `BOOL`, and string to `TEXT`. This generalization gives the user the flexibility to convert the column types as they see fit after ingesting data.

### Usage
As I use [minimist](https://www.npmjs.com/package/minimist) to parse the inputs, use the parameter format specified by the library when passing in arguments on command line.

Example:
`yarn start --dialect=MySQL --database=myDB --password=plaintext $FILE1 $FILE2 ... -k`

Note that a lot of the paramters have sensible defaults:
- `dialect`: postgres
- `host`: localhost
- `database` and `username`: your computer username
- `password`: none
- `limit`: 1000 (how many lines to explore before locking onto the schema - increase if you have some columns that *very* rarely have a non-null value)

Here are the flags (note: appended with single dash) you can pass in:
- `k`: keep the CSV file generated as the intermediary step in ingesting data

### Testing
Run `yarn test` after installing the dependencies.

### Up Next
- [ ] Add support for custom ports, not just the dialect defaults
- [ ] Make password be typed in, instead of being passed from command line
- [ ] Add option to specify which columns to exclude (if at all)
- [ ] Support defaults for invalid fields
- [ ] Add chunking huge files
- [ ] Random sampling + count-based schema analysis
- [ ] Allow types to be passed in as arguments
- [ ] Auto detect and convert timestamps
- [ ] Detect the appropriate string data type based on max length within a column
- [ ] Add support for more data types (arrays, enums, etc)
- [ ] Add support for nested data/JSON column
- [ ] Allow direct ingesting over HTTP (eg. Filebeat/Logstash)
- [ ] Front-end UI (either electron or browser)
- [ ] (up for debate) Self-healing/limited implicit casting
- [ ] (up for debate) JDBC support?

#### Relevant Links
- https://www.postgresql.org/docs/current/static/sql-copy.html
- https://dev.mysql.com/doc/refman/5.7/en/load-data.html
