#!/bin/bash
a=$(cat .version)
[ $# -eq 0 ] && echo "$a" && exit 0
b=$1
list=$(ls *.html)
for f in *.html
do
	cat "$f" | sed "s/""$a""/""$b""/" > .tmp
	mv .tmp "$f"
done
echo $b > .version
