import { readFileSync, writeFileSync } from 'node:fs';

const metadataPath = 'packaging/io.github.AzPepoze.linux-wallpaperengine-gui.metainfo.xml';
const maxReleases = 3;

function readArg(name: string): string {
    const index = process.argv.indexOf(name);
    const value = process.argv[index + 1];

    if (index === -1 || !value) {
        throw new Error(`Missing required argument: ${name}`);
    }

    return value;
}

const version = readArg('--version').replace(/^v/, '');
const date = readArg('--date');

if (!/^[0-9A-Za-z.+_-]+$/.test(version)) {
    throw new Error(`Invalid release version: ${version}`);
}

if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid release date: ${date}`);
}

const xml = readFileSync(metadataPath, 'utf8');
const releasesMatch = xml.match(/<releases>\s*([\s\S]*?)\s*<\/releases>/);

if (!releasesMatch) {
    throw new Error(`Could not find <releases> in ${metadataPath}`);
}

const existing = [...releasesMatch[1].matchAll(/<release\s+version="([^"]+)"\s+date="([^"]+)"\s*\/>/g)]
    .map((match) => ({ version: match[1], date: match[2] }))
    .filter((release) => release.version !== version);

const releases = [{ version, date }, ...existing].slice(0, maxReleases);
const replacement = `<releases>\n${releases
    .map((release) => `    <release version="${release.version}" date="${release.date}"/>`)
    .join('\n')}\n  </releases>`;

const updated = xml.replace(/<releases>\s*[\s\S]*?\s*<\/releases>/, replacement);
writeFileSync(metadataPath, updated);

console.log(`Updated AppStream releases with ${version} (${date})`);
