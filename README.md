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

As of 02/2022, acquired by and living at the New York Times:

https://www.nytimes.com/games/wordle/index.html

Original Wordle game, last known capture on 2022/02/04 before NYT redirect
(This version may be easier, as it doesn't have embedded Google Analytics etc.)

https://web.archive.org/web/20220204025316/https://www.powerlanguage.co.uk/wordle/


**REQUIRED ASSETS**

You will need local copies of these files, at minimum:

https://www.nytimes.com/games/wordle/index.html

The core app code, in `main.*.js`...

https://www.nytimes.com/games/wordle/main.bd4cb59c.js

This may eventually 404 as the game is updated. "View source" on index.html for the latest main .js file.

**OPTIONAL ASSETS**

There are a few other assets, also. Look for 404s in the network tab and grab the `.woff2` webfonts and `.svg` icons, if you want.

The `manifest.json` file has a number of icon images, which may apply if you're bookmarking or adding the app to your home screen.

https://www.nytimes.com/games/wordle/manifest.json

**OPTIONAL: Edit manifest.json**

There is a `start_url` value within `manifest.json` that points to `https://www.nytimes.com/games/wordle`.
If you add this to your home screen (or similar) and find your version bouncing to the NYT version, try `"start_url": "/",`

**ADDING THE "WORDLEBOARD" SCRIPT**

Edit `index.html`, and load this script after the Wordle main `<script>` module:

`<script src="wordleboard.js"></script>`

**OPTIONAL: REMOVING GDPR / COOKIE SCRIPT**

You'll want to find and drop this one, unless you like GDPR banners.

`<script defer type="text/javascript" src="https://www.nytimes.com/games-assets/gdpr/cookie-notice-v2.1.2.min.js"></script>`

**OPTIONAL: REMOVING NYT "data-layer" BEACON, GOOGLE ANALYTICS**

NOTE: You can avoid this by using the pre-acquisition codebase at archive.org.

Post-NYT acquisition, things have understandably changed regarding data collection. Wordle will try to hit some NYT endpoint on load, and Google Analytics via the app script. You can find and drop this, to be nice and not pollute their stats etc.

Find and comment out lines that look like this in the `main.*.js` file:

`/svc/nyt/data-layer` (XHR GET request URL) - comment out the lines with `open()` and `send()` calls, dropping commas as needed to fix syntax errors.

`https://www.googletagmanager.com/gtm.js?id=` (dynamic `<script>` node injection)

**VESTABOARD API REQUIREMENTS**

This script can be configured to have clients call the Vestaboard API directly, but that means exposing your API secrets. You do this alone, in the dark, and at your own risk: along with this convenience, here be dragons etc. 🐉

You will need a Vestaboard account, an API key, secret, and subscriber ID.
These go into a `credentials.json` file. See `credentials.json.example`.
http://web.vestaboard.com/
