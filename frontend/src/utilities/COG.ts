import type STACAsset from "../types/STACAsset";


export function isCOGAsset(asset: STACAsset) {
    const mediaType = asset.media_type;
    const mediaTypeParts = mediaType.split(";").map((s) => s.trim())
    return (
        mediaTypeParts.includes("image/tiff") && 
        mediaTypeParts.includes("application=geotiff") &&
        mediaTypeParts.includes("profile=cloud-optimized")
    )
}
