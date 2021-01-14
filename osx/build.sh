#!/usr/bin/env bash
app_dir=deploy/darwin/build/Evermore.app

rm -rf "${app_dir}"
pwd
rm osx/build.log

npm run build 
npx nodegui-packer --pack dist > osx/build.log
cp -r ../evermore-findersync/client-build/shell_integration/MacOSX/Release/*.appex deploy/darwin/build/Evermore.app/Contents/PlugIns
mv deploy/darwin/build/Evermore.app/Contents/Resources/dist/assets deploy/darwin/build/Evermore.app/Contents/Resources
mv deploy/darwin/build/Evermore.app/Contents/MacOS/qode deploy/darwin/build/Evermore.app/Contents/MacOS/evermore
cp assets/images/icon-macos.icns deploy/darwin/build/Evermore.app/Contents/Resources/iconmacos.icns


set -e

identity=$DEV_IDENTITY
entitlements="deploy/darwin/Evermore.app/Contents/Resources/entitlements.plist"

echo " ### Signing"

# codesign --verbose=4 --strict --timestamp --sign "${identity}" --entitlements "${entitlements}" --options "runtime" ${app_dir}/Contents/Frameworks/*.framework
# codesign --verbose=4 --strict --timestamp --sign "${identity}" --entitlements "${entitlements}" --options "runtime" ${app_dir}/Contents/PlugIns/*/*.dylib
# codesign --verbose=4 --strict --timestamp --sign "${identity}" --entitlements "${entitlements}" --options "runtime" ${app_dir}/Contents/PlugIns/FinderSyncExt.appex
# codesign --verbose=4 --strict --timestamp --sign "${identity}" --entitlements "${entitlements}" --options "runtime" ${app_dir}/Contents/Resources/dist/*.node
# codesign --verbose=4 --strict --timestamp --sign "${identity}" --entitlements "${entitlements}" --options "runtime" ${app_dir}/Contents/MacOS/qode.json
# codesign --verbose=4 --strict --timestamp --sign "${identity}" --entitlements "${entitlements}" --options "runtime" ${app_dir}

echo "### Verifying"

# codesign --verify --deep --verbose=4 "${app_dir}"

# spctl -a -vvvv "${app_dir}"