# osu! web

osu! that can be played in a browser

(under development, currently **not playable**)

It runs on Firefox & Chrome. It doesn't run on Safari currently.

Note: This is an unofficial implementation of [osu!](https://osu.ppy.sh). It has nothing to do with @ppy.

## Running

Just set up a local web server with root directory located where `index.html` is in.

## Current functions

- menu: no
- scroll to change volume: yes
- keyboard button: yes (z x)
- Hit circle: yes
- Slider: partial
- Spinner: no

#### difficulties

- CS: yes
- AR: yes
- OD: no
- star calculation: no
- life drain: no
- scoring: no

#### graphics

currently mixing lazer & stable osu! styled visual elements.

- background: yes
- background dim: yes
- background blur: no
- object fade in/out: yes
- slider snake-in: no
- slider snake-out: no
- hit burst light: no
- hit lighting: no
- beatmap color: yes
- beatmap skin: no
- custom skin: unchecked

#### Hit sounds

currently using lazer hit sounds.

- beatmap general sampleset: yes
- edgeAdditions: yes
- slider reverse & end: always
- slider tick: no
- extra field: no
- timing point sample: yes
- timing point volume: yes
- beatmap hitsounds: no

## Rules

Game field: 512 x 384 (in osu! pixels)

Hit window total length

	300: (80 - 6*OD) ms
	100: (140 - 8*OD) ms
	50: (200 - 10*OD) ms

Circle diameter: `109 - 9*CS` (osu! pixels)

Approach Time: `AR<5? 1800-120*AR: 1950-150*AR`

SpinsRequired: `seconds * lerp(OD(0-5-10), 3-5-7.5))`


## Architecture

`main.js`
	set constants & load resources, setup env

`need-files.js`
	handles osz/osk file drag-drop

`osu.js`
	load from .osu file
	
`playback.js`
	create & update shapes in realtime. Gaming mainly happens here. 
	
`playerActions.js`
	check hits, called by playback.js

#### Execution sequence:

	main -> need-files -> difficulty-select -> playback


## NOTES

- currently using sound.js for hitsound, but not music.

- don't know what `firefox` and `api` is for...

- cursor > approach > hitcircle = slider > follow

- If a slider is longer than given, just truncated it -- This is what's done in osu! lazer.

- About antialiasing: just blur the texture a little bit...


## Future Plan

First I'll work on core gaming experience, including:

- corrent rendering of hit circles, sliders and spinners
- accurate music & hitsounds
- accurate hit grading

Latency should be adjustable.

Scoring, deaths, skins and some of mods might be implemented later on, depending on code complexity.

Modes other than STD (osu) will not be implemented.


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
