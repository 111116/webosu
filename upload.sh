#!/bin/bash
bash ./release.sh
dir="osuweb-""$(cat .version)"
scp "$dir"".zip" root@osuserver:
ssh root@osuserver "./upd.sh"
