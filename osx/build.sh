#!/usr/bin/env bash
app_dir=deploy/darwin/build/Evermore.app

rm -rf "${app_dir}"

npx nodegui-packer --pack dist
cp -r osx/Plugins/* deploy/darwin/build/Evermore.app/Contents/PlugIns
mv deploy/darwin/build/Evermore.app/Contents/Resources/dist/assets deploy/darwin/build/Evermore.app/Contents/Resources

set -e

identity=$DEV_IDENTITY
entitlements="deploy/darwin/Evermore.app/Contents/Resources/entitlements.plist"

echo " ### Signing"

codesign --verbose=4 --strict --timestamp --sign "${identity}" --entitlements "${entitlements}" --options "runtime" ${app_dir}/Contents/Frameworks/*.framework
codesign --verbose=4 --strict --timestamp --sign "${identity}" --entitlements "${entitlements}" --options "runtime" ${app_dir}/Contents/PlugIns/*/*.dylib
codesign --verbose=4 --strict --timestamp --sign "${identity}" --entitlements "${entitlements}" --options "runtime" ${app_dir}/Contents/PlugIns/FinderSyncExt.appex
codesign --verbose=4 --strict --timestamp --sign "${identity}" --entitlements "${entitlements}" --options "runtime" ${app_dir}/Contents/Resources/dist/*.node
codesign --verbose=4 --strict --timestamp --sign "${identity}" --entitlements "${entitlements}" --options "runtime" ${app_dir}/Contents/MacOS/qode.json
codesign --verbose=4 --strict --timestamp --sign "${identity}" --entitlements "${entitlements}" --options "runtime" ${app_dir}

echo "### Verifying"

codesign --verify --deep --verbose=4 "${app_dir}"

spctl -a -vvvv "${app_dir}"