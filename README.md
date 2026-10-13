# STAC Search

STAC Search is a search engine for geospatial datasets. STAC Search indexes public static STAC catalogs and makes them searchable in a single place. It provides a web interface that allows searching by keywords and spatial extents.

A public instance of STAC Search is provided at: https://stacsearch.org/

## Background

There are currently a large number of public STAC catalogs available from many dataset providers. While STAC catalogs provide a convenient way for dataset users to browse through dataset metadata, the usefulness of STAC catalogs is limited by their lack of discoverability. Dataset users must manually traverse multiple STAC catalogs from multiple organizations to find datasets that are relevant to their use cases. STAC Search aims to make it easier to search through catalogs from multiple providers.

STAC Search is implemented as a FastAPI server backend with React web frontend. Data is stored and indexed in PostGIS. The map web interface is built on top of OpenLayers.

STAC Search is currently in **experimental prototype** stage, and is not suitable for production usage.

## Related work

- [STAC Collection Discovery](STAC Collection Discovery) is a project that performs searches over multiple STAC APIs and aggregates the results. In some sense, it is the complement of STAC Search: STAC Collection Discovery _only_ searches API catalogs, and STAC Search _only_ searches static catalogs
- [SFEOS (stac-fastapi-elasticsearch-opensearch)](https://github.com/stac-utils/stac-fastapi-elasticsearch-opensearch/) is a API server for managing and searching through STAC data. STAC Search does not provide a data management API, and only indexes data from a previously crawled catalog. SFEOS uses ElasticSearch, whereas STAC Search uses PostGIS.
- [stac-server](https://github.com/stac-utils/stac-server) provides a STAC API server on top of static STAC catalogs. Unlike stac-server, STAC Search exposes a API that is very minimal and is not conformant to the STAC API specification or the [STAC API extensions](https://stac-api-extensions.github.io/).

## Installation

### Prerequisites

Install the following on your system:

- [uv](https://docs.astral.sh/uv/): Python package manager
- [Yarn](https://yarnpkg.com/): JavaScript / TypeScript package manager
- [PostgreSQL](https://www.postgresql.org/) (Version 18): Relational database
- [PostGIS](https://postgis.net/): Geospatial extensions for PostgreSQL

### Run the frontend in development mode

To serve the frontend in development mode, nagivate to the `frontend/` directory and run:

```sh
yarn install
yarn dev
```

Then navigate to http://localhost:5173/ in your browser. You should be able to see the frontend, but backend API queries will not work yet.

### Load data into PostGIS

Create a database in PostgreSQL and enable [PostGIS extensions](https://postgis.net/documentation/getting_started/install_windows/enabling_postgis/).

Configure the connection string for PostgreSQL as an environment variable. You can export the variable in your shell:

```sh
export STAC_SEARCH_POSTGIS_CONNECTION_STRING='postgresql://username:password@localhost:5432/stac_search'
```

Alternatively, create a `.env` file with the following:

```
STAC_SEARCH_POSTGIS_CONNECTION_STRING='postgresql://username:password@localhost:5432/stac_search'
```

Download and extract the STAC Catalog data from [this archive](https://storage.googleapis.com/stac-crawler-public/archives/stac_catalogs_20261019.tar.gz). Alternatively, run your own crawl using [STAC Crawler](https://github.com/yifanmai/stac-crawler).

Then load the data into PostGIS:

```sh
uv run stac-search-setup-database path/to/extracted/archive/root
```

### Run the backend in development mode

To serve the backend in development mode, navigate to the repository's root directory and run:

```sh
uv run stac-search
```

Then nagivate to http://localhost:8000/docs in your browser. This should display FastAPI's documentation page, which you can use to experiment with sending API requests to your backend.


### Build the frontend in production mode

To build the frontend in production mode, run:

```sh
yarn build
```

This will produce a production build of static files that can be served by a web server. This will also allow the FastAPI backend server at http://localhost:8000/ to serve the frontend.

### Use the frontend and backend together

If both the frontend and backend are running at the same time, the frontend at http://localhost:5173/ will automatically send API requests to the backend running at http://localhost:8000/.

Alternatively, if the frontend is built in development mode, the frontend will also be served by the backend server at http://localhost:8000/.
