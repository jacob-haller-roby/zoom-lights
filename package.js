const path = require('path');

const resourceHackerPath = path.join(__dirname, './node_modules/node-resourcehacker/ResourceHacker.exe');
const pkgCachePath = "./pkg-cache";
process.env["SOURCE_RESOURCE_HACKER"] = resourceHackerPath;
process.env["PKG_CACHE_PATH"] = pkgCachePath;

const execSync = require("child_process").execSync;

const fs = require("fs-extra");
const pkg = require("pkg");
const pkgfetch = require("pkg-fetch");

const customIconPath = "iconset.ico";
const specificNodeVersion = "13.12.0"; // this must be the full release version, and be supported by pkg https://github.com/zeit/pkg-fetch/blob/master/patches/patches.json
const originalPkgPrecompiledBinaries =`${pkgCachePath}/v2.6/fetched-v${specificNodeVersion}-win-x64.original`;
const customizedPkgPrecompiledBinaries =`${pkgCachePath}/v2.6/fetched-v${specificNodeVersion}-win-x64`;

async function downloadOriginalPkgPrecompiledBinaries() {
    if (!fs.existsSync(originalPkgPrecompiledBinaries)) {
        await pkgfetch.need({nodeRange:`node${specificNodeVersion}`,platform:"win",arch:"x64"});
    }
}
async function customizePkgPrecompiledBinariesIcon() {
    execSync(`${resourceHackerPath} -open ./pkg-cache/v2.6/fetched-v${specificNodeVersion}-win-x64.original -save ./pkg-cache/v2.6/fetched-v${specificNodeVersion}-win-x64 -resource ./${customIconPath} -action addoverwrite -mask ICONGROUP,1,`);
}
async function customizePkgPrecompiledBinaries() {
    if(!fs.existsSync(originalPkgPrecompiledBinaries)){
        await fs.rename(
            customizedPkgPrecompiledBinaries,
            originalPkgPrecompiledBinaries
        );
    }
    await customizePkgPrecompiledBinariesIcon();
}

async function package() {
    console.log("Download pkg precompiled libraries");
    await downloadOriginalPkgPrecompiledBinaries()
        .then(customizePkgPrecompiledBinaries)
        .then(() => {
            execSync(
                "pkg ./dist/App.min.js --target win --output \"Zoom Lights.exe\""
            );
        })
        .then(() => console.log('COMPLETE!'))
        .catch(error => console.error(error));

}

package();