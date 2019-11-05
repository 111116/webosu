# osu! web

osu! that can be played in a browser

(under development)

## 架构

`main.js`
	set constants & load resources, setup env

`need-files.js`
	handles osz/osk file drag-drop

`osu.js`
	load from .osu file
	
`playback.js`
	draw shapes in realtime. Gaming mainly happens here. 
	
`playerActions.js`
	check hits, called by playback.js


流程：

main -> need-files -> difficulty-select -> playback


## NOTES

currently using sound.js for hitsound, but not music.

don't know what `firefox` and `api` is for...


## TODO

先优化游戏核心体验（画面质量，判定，延迟）

再加入准确率，生命值，死亡

界面最后再做

std mode only, no mods or skins

## Current functions

- scrolling during gameplay: enabled
- keyboard button: unsupported
- Hit circle: supported
- Slider: partially supported
- Spinner: not sure
- hitsound: partially supported
- CS, AR, OD: unsupported
- beatmap hitsound: unsupported
- beatmap skin: unsupported

## notes from ddevault/osuweb

For getting replays

https://osu.ppy.sh/web/osu-getreplay.php?c=1740197996&m=0&u=SirCmpwn&h=531445fb945017068978ed385051c204

h is the md5 hash of the map?
c is the replay to get
u is neccessary and it has to match my cookies, fuck that shit

For getting scores:

```
https://osu.ppy.sh/web/osu-osz2-getscores.php?s=0&vv=2&v=1&c=da8aae79c8f3306b5d65ec951874a7fb&f=xi+-+FREEDOM+DiVE+%28Nakagawa-Kanon%29+[FOUR+DIMENSIONS].osu&m=0&i=39804&mods=0&h=&a=0&us=SirCmpwn&ha=531445fb945017068978ed385051c204
```

```
s=0 # dunno
vv=2 # dunno
v=1 # dunno
c=da8aae79c8f3306b5d65ec951874a7fb # dunno
f=xi+-+FREEDOM+DiVE+%28Nakagawa-Kanon%29+[FOUR+DIMENSIONS].osu # file name for the difficulty?
m=0 # game mode?
i=39804 # dunno
mods=0 # obvious
h= # dunno
a=0 # dunno
us=SirCmpwn # obvious
ha=531445fb945017068978ed385051c204 # hash of beatmap
```

Works without the cookies, but needs the username
