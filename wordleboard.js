(function() {

  'use strict';

  /**
   * WORDLEBOARD prototype: Show your Wordle game on a Vestaboard as you play.
   * --------------------------------------------------------------------------------
   * Copyright (c) 2022, Scott Schiller. MIT license. Made with love and fun in mind.
   * https://github.com/scottschiller/wordleboard
   * 
   * URL PARAMETERS - e.g., ?nocache=1&timetravel=1
   * -------------------------------------------------------------------------------
   * nocache=1      - clears localStorage (reset game state/stats, play again etc.)
   * timetravel=1   - play yesterday's Wordle (so you don't spoil today for others!)
   * absent=[color] - draw "missing" letter square as [red|orange|blue|violet|white]
   * force_dev=1    - if specified, always post to the "virtual" Vestaboard device.
   * force_prod=1   - if specified, always post to the "real" Vestaboard device.
   *
   * HINT: timetravel can also accept larger ± values. With great power, etc.
   * Various state and other goings-on are logged to the JS console.
   * 
   * This script is a "plugin" that hooks into the Wordle web game's JS module.
   * A local copy of the "Wordle" web game, and some form of web server is required
   * for the game - and optionally, a local PHP endpoint for Vestaboard API calls.
   * 
   * As of 02/2022, acquired by and living at the New York Times:
   * https://www.nytimes.com/games/wordle/index.html
   *
   * Original Wordle game, last known capture on 2022/02/04 before NYT redirect:
   * (This version may be easier, as it doesn't have embedded Google Analytics etc.)
   * https://web.archive.org/web/20220204025316/https://www.powerlanguage.co.uk/wordle/
   * 
   * REQUIRED ASSETS
   * -------------------------------------------------------------------------------
   * You will need local copies of these files, at minimum:
   * https://www.nytimes.com/games/wordle/index.html
   * 
   * And the latest version of the script it uses, main.*.js - at present...
   * https://www.nytimes.com/games/wordle/main.bd4cb59c.js
   * 
   * There are a few other assets, also. Look for 404s in the network tab, and grab
   * the .woff2 webfonts and .svg icons if you want.
   *
   * The manifest.json file has a number of icon images, which may apply if you're
   * bookmarking or adding the app to your home screen.
   *
   * https://www.nytimes.com/games/wordle/manifest.json
   * 
   * OPTIONAL: Edit manifest.json
   * -------------------------------------------------------------------------------
   * 
   * There is a `start_url` value within `manifest.json` that points to the NYT,
   * https://www.nytimes.com/games/wordle
   * 
   * If you add this to your home screen (or similar) and find your version bouncing
   * to the NYT version, try "start_url": "/",
   *
   * ADDING THE "WORDLEBOARD" SCRIPT
   * -------------------------------------------------------------------------------
   * Edit `index.html`, and load this script after the main Wordle main module:
   * <script src="wordleboard.js"></script>
   * 
   * OPTIONAL: REMOVING NYT GDPR / COOKIE SCRIPT
   * -------------------------------------------------------------------------------
   * You'll want to find and drop this one, unless you like GDPR banners.
   * <script 
   *  defer
   *  type="text/javascript"
   *  src="https://www.nytimes.com/games-assets/gdpr/cookie-notice-v2.1.2.min.js">
   * </script>
   *
   * OPTIONAL: REMOVING NYT "data-layer" BEACON, GOOGLE ANALYTICS
   * -------------------------------------------------------------------------------
   * NOTE: You can avoid this by using the pre-acquisition codebase at archive.org.
   * 
   * Post-NYT acquisition, things have understandably changed regarding data / stats
   * collection. Wordle will try to hit some NYT endpoint on load, and Google
   * Analytics via the app script. You can find and drop this, to be nice and not
   * pollute their stats etc.
   * 
   * Find and comment out lines that look like this in the main.*.js file:
   * /svc/nyt/data-layer
   * (XHR GET request URL)
   * Comment out the lines with open() and send() calls, dropping commas as needed
   * to fix syntax errors.
   * 
   * Also, comment out lines with this:
   * https://www.googletagmanager.com/gtm.js?id=
   * (dynamic `<script>` node injection)
   * 
   * VESTABOARD API REQUIREMENTS
   * -------------------------------------------------------------------------------
   * This script can be configured to have clients call the Vestaboard API directly,
   * but that means exposing your API secrets. You do this alone, in the dark, and
   * at your own risk: along with this convenience, here be dragons etc. 🐉
   * 
   * You will need a Vestaboard account, an API key, secret, and subscriber ID.
   * These go into a `credentials.json` file. See `credentials.json.example`.
   * http://web.vestaboard.com/
   * 
   */

  // When running on the given host, use dev / virtual Vestaboard credentials
  // unless ?force_prod=1 has been specified. alternately, ?force_dev=1 from "prod."
  // One possible dev option for Python users: `python -m SimpleHTTPServer`
  const DEV_DOMAIN = 'localhost';

  // URL to hit with ?characters=[...] data for Vestaboard - PHP or otherwise
  // Convenient built-in server for local testing: `php -S localhost:9000`
  const endpoint = 'vestaboard.php';

  /**
   * /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/
   * ---------- 🐉 🐉 🐉 WARNING: CONVENIENCE / SECURITY TRADE-OFF 🐉 🐉 🐉 ----------
   * /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/
   * Set `useClientFetch = true` if you don't have PHP or similar CGI available,
   * and want clients to hit the API directly. This means ANYONE can see your
   * API secrets: use at your own risk. Probably OK for dev, home / trusted LAN use.
   * 
   * NOTE: You may have to edit and/or remove .htaccess in this case, too,
   * because I'm actively trying to help you avoid shooting yourself in the foot. ;)
   */
  const useClientFetch = false;

  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop)
  });

  if (params.timetravel && !isNaN(params.timetravel)) {

    // e.g., ?timetravel=1. By default, subtract `n` days and go into the past.
    // Specify a -ve number if you want to go to the future - at your own risk. ;)
    let timeTravelDays = parseInt(params.timetravel, 10);

    let tt = Math.abs(timeTravelDays);

    const _Date = Date;

    // And here, we do terrible, terrible things: Monkey-patching `window.Date`.
    // Here be dragons. 🐉
    window.Date = function(ts) {

      const time = (ts ? new _Date(ts) : new _Date()).getTime();

      // ±, msec per day.
      return new _Date(time - (timeTravelDays * 86400000));

    }

    // As I said: terrible things. ;)
    window.Date.now = _Date.now;

    console.log(`⏰ Time travel mode: going ${tt} ${tt === 1 ? 'day' : 'days'} ${(timeTravelDays * -1) > 0 ? 'into the future. You rebel.' : 'into the past.'}`)
    console.log(`⏰ Game date now: ${new Date()}`);
    console.log('⏰ Time travel mode: Clearing LS to avoid time paradox');

  }

  if (params.timetravel || params.nocache) {
    // To avoid a time travel paradox, it's best to clear cache.
    try {
      localStorage.clear();
      console.log('💾✨ localStorage cleared OK');
    } catch(err) {
      console.log('💾⛔ Warning: localStorage failed to clear. May be disabled.');
    }
  } else {
    try {
      localStorage.getItem('test');
    } catch(err) {
      // browser is likely blocking cookies and storage access.
      console.warn('💾⛔ Wordle requires localStorage access to work.');
    }
  }

  let isDev;

  if ((document.domain === DEV_DOMAIN && !params.force_prod) || params.force_dev) {
    console.log('📟 Using DEV credentials / virtual device');
    isDev = true;
  } else {
    console.log('📟 Using PROD credentials / real hardware');
    isDev = false;
  }

  // Optional: colors that aren't already used by Wordle
  const colors = {
    red: 63,
    orange: 64,
    blue: 67,
    violet: 68,
    white: 69,
    black: 0
  };

  // Which color to use when a player's letter is not in the word
  // Customize via URL param, e.g., ?absent=blue
  const absentColor = colors[params.absent] || colors.white;

  if (params.absent) {
    if (!absentColor) {
      console.log(`🚫 Warning: "absent" color param "${params.absent}" not found. Valid options: ${Object.keys(colors).toString().replace(/,/g, ', ')}. Defaulting to white.`);
    } else {
      console.log(`🎨 Using ${params.absent} for "absent" characters`);
    }
  }

  // Wordle status -> Vestaboard color
  const colorMap = {
    absent: absentColor || 0, // default: blank / empty
    present: 65, // yellow
    correct: 66  // green
  };

  // Specific Vestaboard characters
  // https://docs.vestaboard.com/characters
  let keyMap = {
    space: 0,
    poundSign: 39
  };

  // Vestaboard does not follow ASCII character codes; map out the ones we expect to use.
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '1234567890';

  for (let j = 0; j < chars.length; j++) {
    // "A" (ASCII 65) = 1 in Vestaboard land
    keyMap[chars.charAt(j)] = 1 + j;
  }

  for (let j = 0; j < numbers.length; j++) {
    // "1" (ASCII 49) = 27 in Vestaboard land.
    // unlike ASCII 0-9, Vestaboard is 1-9 and then 0.
    keyMap[numbers.charAt(j)] = 27 + j;
  }

  let app;

  let rowIndex = 0;

  let credentials;

  function addSpacing(array, count = 5) {

    if (!array) return;

    for (let i = 0; i < count; i++) {
      array.push(keyMap.space);
    }
    
  }

  function makeRow(offset) {

    let row = [];
    let i;

    // Left spacing
    addSpacing(row);

    // 5-letter word, or empty string (depending on game progress)
    const word = app.boardState[offset].toUpperCase();

    if (word) {

      // ASCII -> Vestaboard letter
      for (i = 0; i < word.length; i++) {
        row.push(keyMap[word.charAt(i)]);
      }

    } else {

      // empty row / word
      addSpacing(row);

    }

    // Middle spacing
    addSpacing(row, 2);

    // Array of strings indicating character matches: absent|present|correct
    const evalData = app.evaluations[offset];

    if (!evalData) {

      // Row empty, not played yet; fill in with blanks.
      addSpacing(row);

    } else {

      // Color block for each letter (blank or ?absent=[color], yellow, green)
      evalData.forEach(function(item) {
        row.push(colorMap[item]);
      });

    }

    // Last row, special treatment: also include the Wordle "day" (number) string
    if (offset === 5) {

      let day = parseInt(app.dayOffset, 10);
      
      // Hackish
      if (params.yesterday) day--;

      day = day.toString();

      // Insert enough space to right-align the day string, #xxx
      addSpacing(row, 5 - (day.length + 1));
      
      row.push(keyMap.poundSign);

      // ASCII (day) digits -> Vestaboard digits
      for (i = 0; i < day.length; i++) {
        row.push(keyMap[day.charAt(i)]);
      }

    } else {

      // Fill in rest of row
      addSpacing(row);

    }

    return row;

  }

  function showTitleScreen() {

    // "VESTABOARD PROTOTYPE" message (with green + yellow stripes)
    const characters = [
      [66,0,0,0,0,65,65,65,65,65,0,0,0,0,65,65,65,65,65,0,0,0],
      [65,65,0,0,0,0,66,66,66,66,66,0,0,0,0,66,66,66,66,66,0,0],
      [66,66,66,0,23,15,18,4,12,5,2,15,1,18,4,0,65,65,65,65,65,0],
      [65,65,65,65,0,16,18,15,20,15,20,25,16,5,0,0,0,66,66,66,66,66],
      [66,66,66,66,66,0,0,0,0,65,65,65,65,65,0,0,0,0,65,65,65,65],
      [0,65,65,65,65,65,0,0,0,0,66,66,66,66,66,0,0,0,0,66,66,66]
    ];

    console.log('📟 Wordleboard: Displaying “Title screen”');

    // string
    sendToVestaboard(JSON.stringify(characters));

  }

  function updateVestaboard() {

    /**
     *   Vestaboard: 22 x 6
     * ----------------------
     *      WORD1  *****     
     *      WORD2  *****     
     *      WORD3  *****     
     *      WORD4  *****     
     *      WORD5  *****     
     *      WORD6  ***** #xxx
     * ----------------------
     * (where #xxx is `dayOffset`)
     */

    const data = [];

    // build the vestaboard "view" of the current game state,
    // an array of strings.
    for (let i = 0; i < 6; i++) {
      data.push('[' + makeRow(i).join(',') + ']');
    }

    // string to send to endpoint: stringified 2D array of numbers.
    const characters = '[' + data.join(',') + ']';

    sendToVestaboard(characters);

  }

  function fetchCredentials(callback) {
   
    // already got 'em?
    if (credentials) return callback(credentials);

    const url = 'credentials.json';

    console.log(`🐕 Fetching ${url}...`);

    // go get 'em.
    fetch(url)
    .then(response => response.json())
    .then(data => {
        credentials = data;
        console.log('💌 Fetched “TOP-SECRET” credentials 🔑🤫🤣👉', credentials);
        callback(credentials);
    }).catch(e => {
      console.error(`💣 Unable to make Vestaboard API call. Missing, malformed or blocked ${url}? see credentials.json.example`, e);
      return;
    });

  }

  function sendToVestaboard(characters) {

    let url;

    if (endpoint && !useClientFetch) {

      // PHP / CGI route

      url = endpoint + '?characters=' + characters;

      if (isDev) {
        url += '&is_dev=1';
      }

      console.log(`💬 Calling endpoint ${url}`);

      fetch(url, { cache: 'no-store' })
      .then(response => response.text())
      .then(data => console.log('💌 Endpoint response', data));

    } else {

      // Get, then use credentials to make Vestaboard API call.

      // Form body: not *exactly* JSON. Format is `{"characters" : [[0,0,0,...],[0,0,0,...]]}` - note that value is not in double-quotes.
      const body = `{"characters": ${characters.toString()}}`;

      console.log(`💬 Calling Vestaboard API...`, body);

      fetchCredentials((credentials) => {

        // determine whether we're using a virtual Vestaboard, or a real one
        // naming hint: https://youtu.be/rUt7D4PnjxU
        const setecAstronomy = credentials[isDev ? 'dev' : 'prod'];

        // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
        // https://docs.vestaboard.com/methods
        fetch(`https://platform.vestaboard.com/subscriptions/${setecAstronomy.subscription_id}/message`, {
          method: 'POST',
          cache: 'no-store',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Vestaboard-Api-Key': setecAstronomy.api_key,
            'X-Vestaboard-Api-Secret': setecAstronomy.api_secret
          },
          body
        })
        .then(response => response.text())
        .then(data => console.log('💌 Vestaboard API response', data));

      });
      
    }

  }

  // hook into the Wordle game
  window.addEventListener('load', () => {

    let appNodes = document.getElementsByTagName('game-app');

    if (!appNodes.length) {
      console.warn('💣 Wordleboard: No <game-app> node found. Did the Wordle app load?');
      return;
    }

    app = appNodes[0];

    if (!app || !app.evaluateRow) {
      console.warn('💣 Wordleboard: Wordle appears to have failed.');
      return;
    }

    // user may be resuming a partially-complete game from localStorage
    rowIndex = app.rowIndex;

    showTitleScreen();

    // update the Vestaboard each time the user completes a row.
    const originalEvaluateRow = app.evaluateRow.bind(app);

    app.evaluateRow = () => {

      originalEvaluateRow();

      // only update if user has completed a row, i.e., app.rowIndex has changed
      if (app.rowIndex === rowIndex) return;

      rowIndex = app.rowIndex;
      updateVestaboard();

    }

  });

}());