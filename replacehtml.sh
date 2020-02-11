#!/bin/bash
[ $# -eq 0 ] && echo "$0" "<old> <new>" && exit 0
[ $# -eq 1 ] && echo "$0" "<old> <new>" && exit 0
a=$1
b=$2
list=$(ls *.html)
for f in *.html
do
	cat "$f" | sed "s/""$a""/""$b""/" > .tmp
	mv .tmp "$f"
done
