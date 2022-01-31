## WORDLEBOARD prototype
### Show your Wordle game on a Vestaboard as you play.
--------------------------------------------------------------------------------
Copyright (c) 2022, Scott Schiller. MIT license. Made with love and fun in mind.

90-second video demo:
https://twitter.com/schill/status/1486125847173951489

Image: Locally-hosted Wordle webapp including `wordleboard.js`, and PHP (or browser `fetch()`)-based calls to Vestaboard API.

![wordleboard-example](https://user-images.githubusercontent.com/174437/151127652-62667f4a-bc0a-4168-b038-b91053fe9407.jpg)

**URL PARAMETERS - e.g., `?nocache=1&timetravel=1`**

```
nocache=1      - clears localStorage (reset game state/stats, play again etc.)
timetravel=1   - play yesterday's Wordle (so you don't spoil today for others!)
absent=[color] - draw "missing" letter square as [red|orange|blue|violet|white]
force_dev=1    - if specified, always post to the "virtual" Vestaboard device.
force_prod=1   - if specified, always post to the "real" Vestaboard device.
```
HINT: `timetravel` can also accept larger ± values. With great power, etc.
Various state and other goings-on are logged to the JS console.

This script is a "plugin" that hooks into the Wordle web game's JS module.
A local copy of the "Wordle" web game, and some form of web server is required
for the game - and optionally, a local PHP endpoint for Vestaboard API calls.

Original Wordle game:

https://www.powerlanguage.co.uk/wordle/

**REQUIRED ASSETS**

You will need local copies of these files, at minimum:

https://www.powerlanguage.co.uk/wordle/index.html

And the latest version of the script it uses, main.*.js - at present...

https://www.powerlanguage.co.uk/wordle/main.e65ce0a5.js

(In future, "view source" on index.html if this throws a 404.)


There are a few other assets, also.

https://www.powerlanguage.co.uk/wordle/manifest.html

https://www.powerlanguage.co.uk/wordle/images/wordle_logo_32x32.png

https://www.powerlanguage.co.uk/wordle/images/wordle_logo_144x144.png

https://www.powerlanguage.co.uk/wordle/images/wordle_logo_192x192.png

**ADDING THIS SCRIPT TO WORDLE**

Edit `index.html`, and load this script after the Wordle main `<script>` module:

`<script src="wordleboard.js"></script>`

**VESTABOARD API REQUIREMENTS**

This script can be configured to have clients call the Vestaboard API directly,
but that means exposing your API secrets. You do this alone, in the dark, and
at your own risk: along with this convenience, here be dragons etc. 🐉

You will need a Vestaboard account, an API key, secret, and subscriber ID.
These go into a `credentials.json` file. See `credentials.json.example`.
http://web.vestaboard.com/
