# STAC Search

[STAC Search](https://stacsearch.org/) ([https://stacsearch.org/](https://stacsearch.org/)) is a search engine for geospatial datasets. STAC Search indexes public static STAC catalogs and makes them searchable in a single place. It provides a web interface that allows searching by keywords and spatial extents.

## Background

There are currently a large number of public STAC catalogs available from many dataset providers. While STAC catalogs provide a convenient way for dataset users to browse through dataset metadata, the usefulness of STAC catalogs is limited by their lack of discoverability. Dataset users must manually traverse multiple STAC catalogs from multiple organizations to find datasets that are relevant to their use cases.

## Related work

TODO

## Architecture

STAC Search is implemented as a FastAPI server backend with React web frontend. The map web interface is built on top of [OpenLayers](https://openlayers.org/).

## Installation

### Prerequisites

Install the following on your system:

- [uv](https://docs.astral.sh/uv/): Python package manager
- [Yarn](https://yarnpkg.com/): JavaScript / TypeScript package manager
- [PostgreSQL](https://www.postgresql.org/) (Version 18): Relational database
- [PostGIS](https://postgis.net/): Geospatial extensions for PostgreSQL

### Running the frontend in development mode

To serve the frontend in development mode, nagivate to the `frontend/` directory and run:

```sh
yarn install
yarn dev
```

Then navigate to http://localhost:5173/ in your browser. You should be able to see the frontend, but backend API queries will not work yet.

### Running the backend in development mode

To serve the backend in development mode, navigate to the repository's root directory and run:

```sh
uv run stac-search
```

Then nagivate to http://localhost:8000/docs in your browser. This should display FastAPI's documentation page, which you can use to experiment with sending API requests to your backend.

### Loading data into PostGIS

TODO: Add instructions here.

### Building the frontend in production mode

To build the frontend in production mode, run:

```sh
yarn build
```

This will produce a production build of static files that can be served by a web server. This will also allow the FastAPI backend server at http://localhost:8000/ to serve the frontend.

### Using the frontend and backend together

If both the frontend and backend are running at the same time, the frontend at http://localhost:5173/ will automatically send API requests to the backend running at http://localhost:8000/.

Alternatively, if the frontend is built in development mode, the frontend will also be served by the backend server at http://localhost:8000/.
