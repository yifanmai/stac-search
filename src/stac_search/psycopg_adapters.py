import binascii
import typing

from geojson_pydantic.geometries import Geometry, parse_geometry_obj
from geomet import wkb
from psycopg.abc import AdaptContext
from psycopg.adapt import Buffer, Dumper, Loader
from psycopg.pq import Format
from psycopg.types import TypeInfo


class GeometryBinaryDumper(Dumper):
    format = Format.BINARY

    def dump(self, geometry: Geometry) -> Buffer:
        return wkb.dumps(geometry.model_dump())


class GeometryTextDumper(Dumper):
    format = Format.TEXT

    def dump(self, geometry: Geometry) -> Buffer:
        return binascii.hexlify(wkb.dumps(geometry.model_dump()))


class GeometryBinaryLoader(Loader):
    format = Format.BINARY

    def load(self, data: Buffer) -> Geometry:
        return parse_geometry_obj(wkb.loads(bytes(data)))


class GeometryTextLoader(Loader):
    format = Format.TEXT

    def load(self, data: Buffer) -> Geometry:
        return parse_geometry_obj(wkb.loads(binascii.unhexlify(bytes(data))))


def get_geometry_types():
    assert typing.get_origin(Geometry) is typing.Annotated
    geometry_union_type = typing.get_args(Geometry)[0]
    assert typing.get_origin(geometry_union_type) is typing.Union
    for geometry_type in typing.get_args(geometry_union_type):
        yield geometry_type


def register_adapters(type_info: TypeInfo, context: AdaptContext) -> None:
    context.adapters.register_loader(type_info.oid, GeometryTextLoader)
    context.adapters.register_loader(type_info.oid, GeometryBinaryLoader)

    for geometry_type in get_geometry_types():
        context.adapters.register_dumper(geometry_type, GeometryTextDumper)
        context.adapters.register_dumper(geometry_type, GeometryBinaryDumper)
