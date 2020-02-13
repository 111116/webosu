#!/bin/bash
dir="osuweb-""$(cat .version)"
mkdir "$dir"
cp *.js *.html *.png *.svg *.json *.md LICENSE "$dir"
cp -r style scripts skin fonts "$dir"
mkdir "$dir""/hitsounds"
cp hitsounds/*.ogg "$dir""/hitsounds/"
zip -r "$dir"".zip" "$dir"
rm -rf "$dir"
