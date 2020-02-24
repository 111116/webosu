#!/bin/bash
dir="osuweb-""$(cat .version)"
mkdir "$dir"
cp *.js *.html *.png *.svg *.json *.md LICENSE "$dir"
cp -r hitsounds style scripts skin fonts "$dir"
zip -r "$dir"".zip" "$dir"
rm -rf "$dir"
