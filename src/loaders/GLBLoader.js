export class GLBLoader {
    static async loadGLB(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load ${url}`);
        const arrayBuffer = await response.arrayBuffer();
        return await this.parseGLB(arrayBuffer, url);
    }

    static async parseGLB(arrayBuffer, baseURL = '') {
        const dataView = new DataView(arrayBuffer);
        let offset = 0;

        const magic = dataView.getUint32(offset, true); offset += 4;
        if (magic !== 0x46546C67) throw new Error("Not a GLB file");
        const version = dataView.getUint32(offset, true); offset += 4;
        const length = dataView.getUint32(offset, true); offset += 4;

        let json = null;
        let binBuffer = null;

        while (offset < length) {
            const chunkLength = dataView.getUint32(offset, true); offset += 4;
            const chunkType = dataView.getUint32(offset, true); offset += 4;
            const chunkData = arrayBuffer.slice(offset, offset + chunkLength);

            if (chunkType === 0x4E4F534A) {
                const text = new TextDecoder().decode(chunkData);
                json = JSON.parse(text);
            } else if (chunkType === 0x004E4942) {
                binBuffer = chunkData;
            }

            offset += chunkLength;
        }

        if (!json) throw new Error("GLB JSON not found");

        const meshes = json.meshes.map(mesh => {
            const primitives = mesh.primitives.map(prim => {
                const attributes = {};
                for (const attr in prim.attributes) {
                    attributes[attr] = this.extractAccessor(json, prim.attributes[attr], binBuffer);
                }

                const indices = prim.indices !== undefined
                    ? this.extractAccessor(json, prim.indices, binBuffer)
                    : null;

                const material = prim.material !== undefined ? json.materials[prim.material] : null;
                return { attributes, indices, material };
            });
            return { primitives, name: mesh.name || "mesh" };
        });

        const textures = await this.loadTextures(json, binBuffer, baseURL);
        
        const materials = (json.materials || []).map((material, index) => {
            const processedMaterial = { ...material };
            
            if (material.pbrMetallicRoughness) {
                const pbr = material.pbrMetallicRoughness;
                
                if (pbr.baseColorTexture && pbr.baseColorTexture.index !== undefined) {
                    const textureInfo = json.textures[pbr.baseColorTexture.index];
                    if (textureInfo && textureInfo.source !== undefined) {
                        processedMaterial._baseColorTextureIndex = material.pbrMetallicRoughness?.baseColorTexture?.index ?? null;

                    }
                }
                
                if (pbr.metallicRoughnessTexture && pbr.metallicRoughnessTexture.index !== undefined) {
                    const textureInfo = json.textures[pbr.metallicRoughnessTexture.index];
                    if (textureInfo && textureInfo.source !== undefined) {
                        processedMaterial._baseColorTextureIndex = material.pbrMetallicRoughness?.baseColorTexture?.index ?? null;
                    }
                }
            }
            
            if (material.normalTexture && material.normalTexture.index !== undefined) {
                const textureInfo = json.textures[material.normalTexture.index];
                if (textureInfo && textureInfo.source !== undefined) {
                    processedMaterial.normalTexture = textures[textureInfo.source];
                }
            }
            
            if (material.emissiveTexture && material.emissiveTexture.index !== undefined) {
                const textureInfo = json.textures[material.emissiveTexture.index];
                if (textureInfo && textureInfo.source !== undefined) {
                    processedMaterial.emissiveTexture = textures[textureInfo.source];
                }
            }
            
            if (material.occlusionTexture && material.occlusionTexture.index !== undefined) {
                const textureInfo = json.textures[material.occlusionTexture.index];
                if (textureInfo && textureInfo.source !== undefined) {
                    processedMaterial.occlusionTexture = textures[textureInfo.source];
                }
            }
            
            return processedMaterial;
        });

        return { 
            meshes, 
            materials, 
            textures, 
            images: textures,
            json, 
            binBuffer 
        };
    }

    static async loadTextures(json, binBuffer, baseURL) {
        const textures = [];
        
        if (!json.images || !json.images.length) return textures;
        
        for (let i = 0; i < json.images.length; i++) {
            const image = json.images[i];
            let textureData = null;
            
            if (image.bufferView !== undefined) {
                textureData = await this.loadEmbeddedImage(image, json, binBuffer, i);
            } else if (image.uri) {
                textureData = await this.loadExternalImage(image, baseURL, i);
            }
            
            if (textureData) {
                textures.push(textureData);
            } else {
                textures.push(null);
            }
        }
        
        return textures;
    }

    static async loadEmbeddedImage(image, json, binBuffer, imageIndex) {
        try {
            const bufferView = json.bufferViews[image.bufferView];
            const byteOffset = bufferView.byteOffset || 0;
            const byteLength = bufferView.byteLength;
            
            const imageData = binBuffer.slice(byteOffset, byteOffset + byteLength);
            
            let mimeType = image.mimeType;
            if (!mimeType) {
                const view = new Uint8Array(imageData.slice(0, 8));
                if (view[0] === 0xFF && view[1] === 0xD8 && view[2] === 0xFF) {
                    mimeType = 'image/jpeg';
                } else if (view[0] === 0x89 && view[1] === 0x50 && view[2] === 0x4E && view[3] === 0x47) {
                    mimeType = 'image/png';
                } else if (view[0] === 0x47 && view[1] === 0x49 && view[2] === 0x46) {
                    mimeType = 'image/gif';
                } else if (view[0] === 0x42 && view[1] === 0x4D) {
                    mimeType = 'image/bmp';
                } else {
                    mimeType = 'image/png';
                }
            }
            
            return new Promise((resolve) => {
                const blob = new Blob([imageData], { type: mimeType });
                const objectURL = URL.createObjectURL(blob);
                
                const img = new Image();
                img.onload = () => {
                    resolve({
                        ...image,
                        mimeType,
                        image: img,
                        width: img.width,
                        height: img.height,
                        data: imageData,
                        blob: blob,
                        objectURL: objectURL,
                        isEmbedded: true
                    });
                };
                img.onerror = (err) => {
                    URL.revokeObjectURL(objectURL);
                    resolve(null);
                };
                img.src = objectURL;
            });
        } catch (error) {
            return null;
        }
    }

    static async loadExternalImage(image, baseURL, imageIndex) {
        return new Promise((resolve) => {
            const img = new Image();
            
            if (image.uri.startsWith('data:')) {
                img.onload = () => resolve({
                    ...image,
                    image: img,
                    width: img.width,
                    height: img.height,
                    isEmbedded: false
                });
                img.onerror = () => resolve(null);
                img.src = image.uri;
            } else {
                let imageUrl = image.uri;
                if (baseURL && !image.uri.startsWith('http') && !image.uri.startsWith('//')) {
                    const base = new URL(baseURL, window.location.href);
                    imageUrl = new URL(image.uri, base).href;
                }
                
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve({
                    ...image,
                    image: img,
                    width: img.width,
                    height: img.height,
                    uri: imageUrl,
                    isEmbedded: false
                });
                img.onerror = () => resolve(null);
                img.src = imageUrl;
            }
        });
    }

    static extractAccessor(json, index, binBuffer) {
        const accessor = json.accessors[index];
        const bufferView = json.bufferViews[accessor.bufferView];
        const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);

        let TypedArrayConstructor;
        switch (accessor.componentType) {
            case 5120: TypedArrayConstructor = Int8Array; break;
            case 5121: TypedArrayConstructor = Uint8Array; break;
            case 5122: TypedArrayConstructor = Int16Array; break;
            case 5123: TypedArrayConstructor = Uint16Array; break;
            case 5125: TypedArrayConstructor = Uint32Array; break;
            case 5126: TypedArrayConstructor = Float32Array; break;
            default: throw new Error("Unknown component type " + accessor.componentType);
        }

        let numComponents;
        switch (accessor.type) {
            case "SCALAR": numComponents = 1; break;
            case "VEC2": numComponents = 2; break;
            case "VEC3": numComponents = 3; break;
            case "VEC4": numComponents = 4; break;
            case "MAT2": numComponents = 4; break;
            case "MAT3": numComponents = 9; break;
            case "MAT4": numComponents = 16; break;
            default: throw new Error("Unknown accessor type " + accessor.type);
        }

        const array = new TypedArrayConstructor(binBuffer, byteOffset, accessor.count * numComponents);
        return Array.from(array);
    }

    static disposeModel(model) {
        if (model && model.textures) {
            model.textures.forEach(texture => {
                if (texture.objectURL) {
                    URL.revokeObjectURL(texture.objectURL);
                }
            });
        }
    }
}