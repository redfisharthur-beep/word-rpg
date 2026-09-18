import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const outputDir = process.argv[2] || 'build/web';
const CHUNK_BYTES = 20 * 1024 * 1024;
const CLOUDFLARE_ASSET_LIMIT = 25 * 1024 * 1024;

const targets = [
  { name: 'index.pck', mime: 'application/octet-stream' },
  { name: 'index.wasm', mime: 'application/wasm' },
];

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const manifest = {};

for (const target of targets) {
  const fullPath = path.join(outputDir, target.name);
  const original = await fs.readFile(fullPath);
  const originalHash = sha256(original);
  const parts = [];

  for (let offset = 0, index = 0; offset < original.length; offset += CHUNK_BYTES, index += 1) {
    const chunk = original.subarray(offset, Math.min(offset + CHUNK_BYTES, original.length));
    if (chunk.length >= CLOUDFLARE_ASSET_LIMIT) {
      throw new Error(`${target.name} chunk ${index} is too large for Cloudflare: ${chunk.length} bytes`);
    }
    const partName = `${target.name}.part${String(index).padStart(2, '0')}`;
    await fs.writeFile(path.join(outputDir, partName), chunk);
    parts.push({ name: partName, size: chunk.length });
  }

  const rebuiltHash = createHash('sha256');
  let rebuiltBytes = 0;
  for (const part of parts) {
    const data = await fs.readFile(path.join(outputDir, part.name));
    rebuiltHash.update(data);
    rebuiltBytes += data.length;
  }
  if (rebuiltBytes !== original.length || rebuiltHash.digest('hex') !== originalHash) {
    throw new Error(`Split integrity check failed for ${target.name}`);
  }

  manifest[target.name] = {
    size: original.length,
    mime: target.mime,
    parts,
    sha256: originalHash,
  };

  await fs.unlink(fullPath);
  console.log(`Split ${target.name}: ${original.length} bytes -> ${parts.map((part) => part.size).join(' + ')}`);
}

const htmlPath = path.join(outputDir, 'index.html');
let html = await fs.readFile(htmlPath, 'utf8');
const marker = '<script src="index.js"></script>';
if (!html.includes(marker)) {
  throw new Error('Could not find the Godot index.js script tag in index.html');
}
if (html.includes('word-rpg-chunk-loader')) {
  throw new Error('Chunk loader is already present in index.html');
}

const loader = `<script id="word-rpg-chunk-loader">
(() => {
  const manifest = ${JSON.stringify(manifest)};
  const nativeFetch = window.fetch.bind(window);

  function requestUrl(input) {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.href;
    if (input instanceof Request) return input.url;
    return String(input);
  }

  function requestMethod(input, init) {
    if (init && init.method) return String(init.method).toUpperCase();
    if (input instanceof Request) return String(input.method || 'GET').toUpperCase();
    return 'GET';
  }

  window.fetch = async function wordRpgChunkFetch(input, init) {
    const url = new URL(requestUrl(input), window.location.href);
    const filename = decodeURIComponent(url.pathname.split('/').pop() || '');
    const entry = manifest[filename];
    if (!entry) return nativeFetch(input, init);

    const method = requestMethod(input, init);
    if (method !== 'GET' && method !== 'HEAD') return nativeFetch(input, init);

    const headers = new Headers({
      'content-type': entry.mime,
      'content-length': String(entry.size),
      'cache-control': 'public, max-age=31536000, immutable',
    });
    if (method === 'HEAD') {
      return new Response(null, { status: 200, headers });
    }

    const base = new URL('.', url);
    const responses = await Promise.all(entry.parts.map(async (part) => {
      const response = await nativeFetch(new URL(part.name, base), { credentials: 'same-origin' });
      if (!response.ok) {
        throw new Error('Failed loading Godot chunk ' + part.name + ' (' + response.status + ')');
      }
      return response;
    }));

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for (const response of responses) {
            if (!response.body) {
              controller.enqueue(new Uint8Array(await response.arrayBuffer()));
              continue;
            }
            const reader = response.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) controller.enqueue(value);
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, { status: 200, headers });
  };
})();
</script>
${marker}`;

html = html.replace(marker, loader);
await fs.writeFile(htmlPath, html);

await fs.writeFile(
  path.join(outputDir, 'godot-chunks.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);

console.log('Injected Word RPG chunk loader into index.html');
console.log('Godot Web assets are Cloudflare-safe: all split chunks are below 25 MiB.');
