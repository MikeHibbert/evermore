#!/usr/bin/env bash

set -e

app_dir=deploy/darwin/build/Evermore.app
username=$DEV_USERNAME
password=$DEV_PASSWORD
ascProvider="MikeHibbert1170413847"

rm -rf "deploy/darwin/build/Evermore.zip"

echo "### creating zip"
ditto -ck --rsrc --sequesterRsrc --keepParent "${app_dir}" "deploy/darwin/build/Evermore.zip"

echo "### uploading to apple"
xcrun altool --notarize-app -t osx --file "deploy/darwin/build/Evermore.zip" --primary-bundle-id "com.evermore.desktopclient" --username "${username}" --password "${password}" --asc-provider ${ascProvider}