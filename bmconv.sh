# This script converts mp3 music in a beatmap pack into ogg
# Use with caution, as this script is untested.

#!/bin/bash

# create temporary directories
TMPDIR1=$(mktemp -d -t bmconvtemp-XXXXXXXXXX)
TMPDIR2=$(mktemp -d -t bmconvtemp2-XXXXXXXXXX)
# Don't use TMPDIR! That's the environment variable that mktemp is using.

# test argument format
if [ $# != 2 ] || [[ "$1" != *.osz ]] || [[ "$2" != *.osz ]]
then
	echo >&2 Transcode mp3 files in beatmaps to oggs
	echo >&2 usage: "$0" in.osz out.osz
	exit 1
fi

# test prerequisites
command -v realpath &>/dev/null || { echo >&2 "Error: realpath isn't detected"; exit 1; }
command -v sed &>/dev/null || { echo >&2 "Error: sed isn't detected"; exit 1; }
command -v zip &>/dev/null || { echo >&2 "Error: zip isn't detected"; exit 1; }
command -v unzip &>/dev/null || { echo >&2 "Error: unzip isn't detected"; exit 1; }
command -v ffmpeg &>/dev/null || { echo >&2 "Error: ffmpeg isn't detected"; exit 1; }

# extract beatmap content
echo >&2 "[info] extracting osz"
unzip "$1" -d "$TMPDIR1" &>/dev/null || { echo >&2 "Error: failed extracting osz"; exit 1; }

# convert mp3 to ogg
cat "$TMPDIR1"/*.osu | grep "AudioFilename:" | sort | uniq | sed "s/AudioFilename: //" | tr -d '\r' | while read f
do
	echo >&2 "[info] AudioFilename: $f"
	if [[ $f == *.mp3 ]] || [[ $f == *.MP3 ]]
	then
		newf=$(echo $f | sed "s/\.mp3$/_mp3\.ogg/;s/\.MP3$/_mp3\.ogg/")
		mv "$TMPDIR1"/"$f" "$TMPDIR2"/"$f" || exit 1;
		echo "[info] Transcoding to: ""$newf"
		ffmpeg -i "$TMPDIR2"/"$f" "$TMPDIR1"/"$newf" -hide_banner -loglevel fatal || { echo >&2 "Error: failed transcoding"; exit 1; }
	fi
done || exit 1

# replace corresponding audio file names in osu files
echo >&2 "[info] processing osu files"
for f in $TMPDIR1/*.osu
do
	cat "$f" | sed "s/^\(AudioFilename:.*\).mp3/\1_mp3.ogg/;s/^\(AudioFilename:.*\).MP3/\1_mp3.ogg/" > "$TMPDIR2"/osu
	mv "$TMPDIR2"/osu "$f"
done

# export beatmap osz
ofilename=$(realpath "$2")
echo >&2 "[info] exporting osz"
pushd "$TMPDIR1" &>/dev/null
zip "$ofilename" -r * &>/dev/null || { echo >&2 "Error: failed exporting osz"; popd; exit 1; }
popd &>/dev/null

# clean up
rm -rf "$TMPDIR1"
rm -rf "$TMPDIR2"
