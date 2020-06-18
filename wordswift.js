const WordSwift = function(window, document, undefined) {

  let W;
  let c;

  return {

    init: () => {

      W = WordSwift;

      W.config = {

        /* comma separated list of css selectors for each element to add
          WordSwift functionality to */
        wsSelectors: '.ws-article',

        wsChildSelectors: 'div, h1, h2, span, blockquote, li, p',

        /* comma separated list of css selectors for each element that is
          a child of the element(s) targeted above, whose text content
          should be excluded from WordSwift reading */
        wsChildsExcluded: 'form, fieldset, legend, label, datalist, input, button, select, option, optgroup, textarea, script, noscript, template, figure, table, embed, object, video, audio, canvas',

        /* @# */
        includeParentText: true,

        /* set default speed of WordSwift in words per minute */
        wpm: 600,

        /* set default number of words displayed at a time */
        numDisplayWords: 2,

        /* set default font size including unit type */
        fontSize: '40px',

        /* set whether HTML text styles (like underline) used */
        applyWordStyles: 'yes',

        /* @# */
        stepSize: 1,

        /* @# */
        stepSpeed: 50,
      };

      /* settings applied from cookies (if set) or from defaults */
      W.appliedSettings = {
        
        wpm: null,
        numDisplayWords: null,
        fontSize: null,
        applyWordStyles: null,
        stepSize: null,
        stepSpeed: null
      };

      c = WordSwift.config;
      aS = WordSwift.appliedSettings;

      W.rootDomain = W.getRootDomain();

      W.setCookies();
      W.setAppliedSettings();
      W.wsCtnrs;
      W.setWsTriggers();
      W.targ = null;

      W.wsText = [];
      W.wsWords = [];
      W.currWsWord = 0;

      W.msPerWord = parseInt( ( ( 1000 * 60 ) / aS.wpm ) * aS.numDisplayWords, 10 );

      W.clickDown = false;
      W.initMouseXCoord = null;
      W.prevKnobXCoord = null;
      W.numSliderNotches = null;

      W.playWsLastTime = 0;
      W.playTO;
      W.wasPlaying = false;
      W.wordCounter = 0;

      W.mDownOnButtonId = null;
      
      W. wsRafLastTime = 0;
    },

    setCookies: function() {

      // set Words Per Minute Cookie
      if (W.readCookie('wordswift-wpm') === null) {

        W.setCookie({cName: 'wordswift-wpm', cVal: c.wpm, cDays: 9999, cDomain: W.rootDomain});
      }

      if (W.readCookie('wordswift-num-display-words') === null) {

        W.setCookie({cName: 'wordswift-numDisplayWords', cVal: c.numDisplayWords, cDays: 9999, cDomain: W.rootDomain});
      }

      if (W.readCookie('wordswift-fontSize') === null) {

        W.setCookie({cName: 'wordswift-fontSize', cVal: c.fontSize, cDays: 9999, cDomain: W.rootDomain});
      }

      if (W.readCookie('wordswift-applyWordStyles') === null) {

        W.setCookie({cName: 'wordswift-applyWordStyles', cVal: c.applyWordStyles, cDays: 9999, cDomain: W.rootDomain});
      }

      // W.setCookie({cName: 'wordswift-wpm', cVal: c.wpm, cDays: -9999, cDomain: W.rootDomain});
      // W.setCookie({cName: 'wordswift-numDisplayWords', cVal: c.numDisplayWords, cDays: -9999, cDomain: W.rootDomain});
      // W.setCookie({cName: 'wordswift-fontSize', cVal: c.fontSize, cDays: -9999, cDomain: W.rootDomain});
      // W.setCookie({cName: 'wordswift-applyWordStyles', cVal: c.applyWordStyles, cDays: -9999, cDomain: W.rootDomain});

      console.dir(document.cookie);
    },

    setAppliedSettings: function() {

    let wpm = parseInt( W.readCookie('wordswift-wpm'), 10 ),
      numDisplayWords = parseInt(W.readCookie('wordswift-numDisplayWords'), 10 ),
      fontSize = W.readCookie('wordswift-fontSize'),
      applyWordStyles = W.readCookie('wordswift-applyWordStyles');


      aS.wpm = (wpm !== null) ? parseInt( wpm, 10 ) : parseInt( c.wpm, 10 );
      aS.numDisplayWords = (numDisplayWords !== null) ? parseInt( numDisplayWords, 10 ) : parseInt( c.numDisplayWords, 10 );
      aS.fontSize = (fontSize !== null) ? fontSize : c.fontSize;
      aS.applyWordStyles = (applyWordStyles !== null) ? applyWordStyles : c.applyWordStyles;
    },

    updateAppliedSetting: function(setting, val) {

      var cName = 'wordswift-' + setting;
      W.setCookie({cName: cName, cVal: val, cDays: 9999, cDomain: W.rootDomain});
      aS[setting] = val;
    },

    setWsTriggers: function() {

      let triggerEls = document.querySelectorAll( '.ws-trigger-el' );

      for (let i = 0; i < triggerEls.length; i++ ) {

        W.addEvts( triggerEls[ i ], 'click', W.constructWsEls );
      }
    },

    constructWsEls: function( e ) {

      W.targ = e.target || e.srcElement || undefined;
      W.parentClone = W.targ.parentNode.parentNode.cloneNode( true );

      try {

        W.wsEls = W.parentClone.querySelectorAll( c.wsChildSelectors ); //separate this into own mini function so only calced once
      }
      catch ( e ) {

        if ( c.wsChildSelectors === '' ) {

          W.wsEls = W.parentClone.querySelectorAll( '*' );
          return;
        }
        // ??? Now not likely necessary
        alert( e + ' You have provided an invalid selector for c.wsChildSelectors. Please edit the settings portion of the code so the value of c.wsChildSelectors is either an empty string (\'\') or a valid CSS selector or set of comma separated selectors.');
      };

      W.constructWsElsExcluded();
    },

    constructWsElsExcluded: function() {
      try {
        W.wsElsExcluded = W.parentClone.querySelectorAll( c.wsChildsExcluded ); //separate this into own mini function so only calced once
      }
      catch ( e ) {

        if ( c.wsChildsExcluded !== '' ) {
          alert( e + ' You have provided an invalid selector for c.wsChildSelectors. Please edit the settings portion of the code so the value of c.wsChildSelectors is either an empty string (\'\') or a valid CSS selector or set of comma separated selectors.');
        }
        else {

          W.wsElsExcluded = [];
        }
      };

      W.constructWsContent();
    },

    constructWsContent: function() {

      var elems = [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'span', 'li', 'q', 'em', 'blockquote', 'dt', 'dd', 'cite', 'code', 'ins', 'del', 'strong', 'sub', 'sup', 'abbr', 'samp', 'small', 'b', 'i', 's', 'u', 'kbd', 'address', 'dfn', 'data', 'time', 'var', 'mark', 'bdi', 'bdo' ];

      var elemsLen = elems.length;

      W.wsContent = [];

      var scanWsNodes = function( theNode, isWsEl, includeDescendants, isExcluded ) {
        // REMEMBER, NEED TO ONLY ADD THE TEXT OF ELS IF THEY ARE: SPECIFIED IN QSA, OR IF * or '' IS GIVEN AS ARG FOR QSA
        // isWsEl and isIncluded should always start out being false when scanning an el (not text node though)

        var isWsCtnrChild,
            currChild,
            currParent,
            currParentTag,
            nextAncestor,
            spanClass,
            theData;

        var scanAncestors = function( ancestor, wsContentIndex ) {

          var matched = false;
          currParentTag = ancestor.tagName.toLowerCase();
          nextAncestor = ancestor.parentNode;

          // this value needs to be the saved cookie value of the user's preference
          var cookiePref = '';

          // // would if (typeof cookiePref === 'undefined') be better???
          // if (cookiePref !== true && cookiePref !== false) {

          //   if (aS.applyWordStyles == 'no') {

          //     return;
          //   }
          // } else if (cookiePref === false) {

          //   return;
          // }

          for ( var elemIndex = 0; elemIndex < elemsLen; elemIndex++ ) {

            matched = addClasses( elems[ elemIndex ], ancestor, wsContentIndex, false );

            if ( matched === true ) {

              break;
            }
          }

          if ( matched === true && nextAncestor !== W.parentClone ) {

            scanAncestors( nextAncestor, wsContentIndex );

          } else {

            W.wsContent[ wsContentIndex ].styledParents = W.wsContent[ wsContentIndex ].styledParents.replace( /\s+$/g, '' );
          }
        }

        var addClasses = function( elName, ancestor, wsContentIndex, matched ) {

          if ( elName === currParentTag ) {

            matched = true;

            W.wsContent[ wsContentIndex ].styledParents += 'ws-' + currParentTag + ' ';

            if ( currParentTag === 'h1' || currParentTag === 'h2' || currParentTag === 'h3' 
                || currParentTag === 'h4' || currParentTag === 'h5' || currParentTag === 'h6' ) {

              W.wsContent[ wsContentIndex ].styledParents += 'ws-h ';
            }

            if ( currParentTag === 'a' ) {

              W.wsContent[ wsContentIndex ].isAnchorText = true;
              W.wsContent[ wsContentIndex ].theHref = ancestor.href;
            }

            if ( currParentTag === 'span' ) {

              if ( currParent.id !== '' ) {

                W.wsContent[ wsContentIndex ].styledParents += 'ws-' + currParentTag + '-id-' + currParent.id + ' ';
              }

              if ( currParent.className !== '' ) {

                spanClass = currParent.className.replace( /^\s+|\s+$/g, '' );
                spanClass = spanClass.split(/[\s]+/g);

                // ??? need to test this whole thing to see if it works. Also need to come up w/ original var names for this iterator and ones below
                for ( var i = 0; i < spanClass.length; i++ ) {

                  W.wsContent[ wsContentIndex ].styledParents += 'ws-' + currParentTag + '-' + spanClass[ i ] + ' ';
                }                  
              }
            }
          }

          return matched;
        };

        if ( currChild = theNode.firstChild ) {

          do {

            currParent = currChild.parentNode;
            // following code is run for each child of the parentClone, and each child of those children, etc

            // if we're dealing w/ a direct child of parentClone, then we mark that, and also, if no childSelectors or the * is provided, then text from all ancestors is included
            if ( theNode === W.parentClone ) {

              isWsCtnrChild = true;
              includeDescendants = ( c.wsChildSelectors === '' || c.wsChildSelectors ==='*' ) ? true : false;
            }
            else {

              isWsCtnrChild = false;
            }

            if ( currChild.nodeType === 3 ) {

              if ( ( isWsEl === true && isExcluded === false )
                || ( isWsCtnrChild === true && c.includeParentText === true )
                || ( !isExcluded && includeDescendants )  ) {

                if ( currChild.data.match( /[^\s]+/ ) ) {

                  theData = currChild.data.replace( /\n/g, ' ' ).replace( /[\s]{2,}/g, ' ' );

                  W.wsContent.push( {
                    theNode: currChild,
                    theEl: currParent.tagName.toLowerCase(),
                    theData: theData,
                    styledParents: '',
                    isAnchorText: false,  // ??? could be a problem if the W.parent is an <a> ( odd but not inconceivable )
                    theHref: '',
                    isWsEl: isWsEl
                  } );

                  scanAncestors( currParent, W.wsContent.length - 1 );                      
                }
                else {

                  if ( typeof W.wsContent[ 0 ] !== 'undefined' ) {

                    W.wsContent[ W.wsContent.length - 1 ].theData += ' ';
                  }
                }                                
              }
            }

            if ( currChild.nodeType === 1 ) {

              if ( currChild.firstChild ) {  //may need to make this and all other like it !== null / undefined

                // anytime we're dealing w/ an el and not text node, these should be reset to false
                isExcluded = false;
                isWsEl = false;

                // if no selector provided, is assumed all elements should be included
                // Should only need to do this in certain cases, like if includeDescendants is false
                if ( c.wsChildSelectors !== '' && c.wsChildSelectors !== '*' ) {

                  for ( var i = 0; W.wsEls[ i ]; i++ ) {

                    if ( currChild === W.wsEls[ i ] ) {

                      isWsEl = true;
                      includeDescendants = true;

                      break;
                    }
                  }
                }
                else {

                  isWsEl = true;
                }

                for ( var i = 0; W.wsElsExcluded[ i ]; i++ ) {

                  if ( currChild === W.wsElsExcluded[ i ] ) {

                    isWsEl = false;
                    includeDescendants = false;
                    isExcluded = true;

                    break;
                  }
                }

                scanWsNodes( currChild, isWsEl, includeDescendants, isExcluded );
              }
            }

            if ( currChild.nodeType === 8 ) {
              
            }

            if ( currChild.nodeType === 4 ) {
              
            }

          } while ( currChild = currChild.nextSibling )
        }
      };

      // theNode, isWsEl, includeDescendants, isExcluded
      scanWsNodes( W.parentClone, false, false, false );

      W.constructWsPlainText();
    },

    constructWsPlainText: function() {

      var wsLen = W.wsContent.length;
      W.wsPlainText = '';

      for ( var i = 0; i < wsLen; i++ ) {

          W.wsPlainText += W.wsContent[ i ].theData;
      }

      W.wsPlainText = W.wsPlainText.replace( /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '' ).split( /\s+/g );

      W.constructWsWords();
    },

    constructWsWords: function() {

      var wsLen = W.wsContent.length,
        tempWords,
        tempLen;
      W.wsWords = [];

      for ( var i = 0; i < wsLen; i++ ) {

        tempWords = W.wsContent[ i ].theData.replace( /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '' ).split( /\s+/g );
        tempLen = tempWords.length;

        for ( var j = 0; j < tempLen; j++ ) {

          W.wsWords.push( {

            word: tempWords[ j ],
            styledParents: W.wsContent[ i ].styledParents,
            isAnchorText: W.wsContent[ i ].isAnchorText,
            theHref: W.wsContent[ i ].theHref
          } );
        }
      }

      W.correctWsWords();
    },

    correctWsWords: function() {

      //??? need to really go over this function and check specifically for issues that could arise: errors with undefined word properties when this is trying to access word property using the incrementers / indexadjust / etc towards end of W.wsWords. Also, check to make sure there is no way false positives or false negatives could happen.

      var wsWordsLen = W.wsWords.length,
        tempWord = '',
        noMatchCount = 0,
        indexAdjust = 0;

      for ( var i = 0; i < wsWordsLen; i++ ) {

        if ( noMatchCount >= 10 ) {

          return;
        }

        if ( W.wsWords[ i ].word !== W.wsPlainText[ i + indexAdjust ] ) {

          tempWord = '';
          noMatchCount++;
              
          for ( var j = 1; j < 21; j++ ) {

            tempWord = tempWord + W.wsWords[ i + j ].word;

            if ( ( W.wsWords[ i ].word + tempWord ) === W.wsPlainText[ i ] ) {

              W.wsWords[ i ].word = [ {

                word: W.wsWords[ i ].word,
                styledParents: W.wsWords[ i ].styledParents,
                isAnchorText: W.wsWords[ i ].isAnchorText,
                theHref: W.wsWords [ i ].theHref
              } ];

              for ( var k = 1; k <= j; k++ ) {

                W.wsWords[ i ].word.push( {

                  word: W.wsWords[ i + k ].word,
                  styledParents: W.wsWords[ i + k ].styledParents,
                  isAnchorText: W.wsWords[ i + k ].isAnchorText,
                  theHref: W.wsWords[ i + k ].theHref
                } );
              }

              W.wsWords.splice( ( i + 1 ), j );
              wsWordsLen = W.wsWords.length;
              noMatchCount = 0;
              break;
            }
          }

          // just a failsafe for if wsWords and wsPlainText get out of sync for some reason
          // this attempts to find a place where the 2 match again and adjusts what indexes of each
          // arrays are compared for remainder of function
          if ( ( noMatchCount > 0 ) && ( W.wsWords[ i + 1 ].word !== W.wsPlainText[ i + 1 ] ) ) {

            for ( var l = 0 - noMatchCount + 1; l < 10; l++ ) {

              if ( W.wsWords[ i ].word === W.wsPlainText[ i + l ] ) {

                indexAdjust += l;
                noMatchCount = 0;
              }
            }
          }
        }
      }

      W.createWsEls();
    },

    createWsEls: function() {

      let theHTML,
        wpm,
        numDisplayWords,
        fontSize,
        applyWordStyles,
        applyWordStylesYes,
        applyWordStylesNo,
        wsNoWordStylesClass;

      wsNoWordStylesClass = ( aS.applyWordStyles === 'no' ) ? 'ws-no-word-styles' : '' ;
      applyWordStylesYes = ( aS.applyWordStyles === 'yes' ) ? 'selected="selected"' : '';
      applyWordStylesNo = ( aS.applyWordStyles === 'no' ) ? 'selected="selected"' : '';

      theHTML = [
        '<div id="ws-container">',
          '<div id="content-ctnr" class="content-ctnr">',
            '<div class="ws-tab-ctnr clearfix">',
              '<button id="ws-close" class="ws-tab icon-close"><span class="btn-label">Close</span></button>',
              '<button id="ws-settings-b" class="ws-tab icon-list"><span class="btn-label">Settings</span></button>',
              '<button id="ws-info-b" class="ws-tab icon-question"><span class="btn-label">Info</span></button>',
            '</div>',
            '<div id="ws-word" class="ws-word">',
              '<p id="ws-word-cell" class="ws-word-cell ' + wsNoWordStylesClass + '" style="font-size:' + aS.fontSize + ';"></p>',
            '</div>',
            '<div id="ws-progress-ctnr" class="ws-progress-ctnr">',
              '<div id="ws-progress-bar" class="ws-progress-bar">',
                '<div id="ws-progress-knob" class="ws-progress-knob"></div>',
              '</div>',
              '<div id="ws-controls" class="ws-controls">',
                '<button id="ws-beginning" class="ws-beginning ws-button icon-first"></button>',
                '<button id="ws-play" class="ws-play ws-button icon-play"></button>',
                '<button id="ws-backward" class="ws-backward ws-button icon-previous"></button>',
                '<button id="ws-forward" class="ws-forward ws-button icon-next"></button>',
              '</div>',
            '</div>',
            '<div id="ws-settings" class="ws-settings">',
              '<div class="ws-settings-display">',
                '<h1>WordSwift Options</h1>',
                '<label for="ws-speed">Speed (Words Per Minute)</label>',
                '<input id="ws-speed" name="ws-speed" type="text" value="' + aS.wpm + '">',
                '<hr>',
                '<label for="ws-num-words">Number of Words Displayed at a Time</label>',
                '<input id="ws-num-words" name="ws-num-words" type="text" value="' + aS.numDisplayWords + '">',
                '<hr>',
                '<label for="ws-font-size">Font Size (Include unit)</label>',
                '<input id="ws-font-size" name="ws-font-size" type="text" value="' + aS.fontSize + '">',
                '<hr>',
                '<label for="ws-style-words">Apply styles to words based on the semantic value of the text? If yes, text from things like links and headings will be styled to distinguish them from regular text. If no, all words will just appear as plain text. Consult the info section to see a detailed list of all styles applied to words of certain types.</label>',
                '<select id="ws-style-words">',
                  '<option value="yes" ' + applyWordStylesYes + '>Yes</option>',
                  '<option value="no" ' + applyWordStylesNo + '>No</option>',
                '</select>',
              '</div>',
            '</div>',
            '<div id="ws-info" class="ws-info">',
              '<div class="ws-info-display">',
                '<h1>WordSwift Information and Help</h1>',
              '<p>',
                  'Word Swift offers your visitors the ability to read your content at an excellerated pace. The faster your readers can consume your content, the more they will read. It works by eliminating some of the key factors for why so many of us read slower than we\'d like. Single words from an article are flashed on the screen, quickly and in succession, so as to eliminate the need for readers to move their eyes from word to word. Believe it or not, but this adds significantly to the time it takes to get through an article. Also, because the words are flashed so quickly, readers are also able to avoid subvocalization of words as they read. If you\'ve ever noticed yourself "speaking" words to yourself as you read, that is subvocalization and it is entirely unnecessary and serves only to slow you down.',
              '</p>',
              '<h2>Keyboard Shortcuts</h2>',
              '<p>List of keyboard Shortcuts</p>',
              '<h2>Explanation of Styles Applied to Words</h2>',
              '<p>',
                  'WordSwift applies some styles to words to make it easier for you to know more information about the context from which the word was taken. For example, a word taken from a title of a page, is styled in such a way to distinguish it as a title, since that is not otherwise obvious to you as you are reading using WordSwift. The following is a list of the types of elements and the types of styles that will be applied to words that come from them:',
                '</p>',
                '<hr>',
                '<p>',
                  '<span class="ws-h">Words from headers and titles of articles</span>',
                '</p>',
                '<hr>',
                '<p>',
                  '<span class="ws-a">Words from links to other web pages</span>',
                '</p>',
                '<hr>',
                '<p>',
                  '<span class="ws-q">Words from quoted text</span>',
                '</p>',
                '<hr>',
                '<p>',
                  '<span class="ws-em">Words singled out for emphasis</span>',
                '</p>',
                '<hr>',
                '<p>',
                  '<span class="ws-strong">Words singled out for having strong importance</span>',
                '</p>',
                '<hr>',
                '<p>',
                  '<span>Text displayed lower and smaller, such as from numbers in a chemical formula (H<span class="ws-sub">2</span>O)</span>',
                '</p>',
                '<hr>',
                '<p>',
                  '<span>Text displayed higher and smaller, such as from exponents in a math formula (2x<span class="ws-sup">3</span> + 10)</span>',
                '</p>',
                '<hr>',
                '<p>',
                  '<span class="ws-del">Words that were originally part of article, but were removed</span>',
                '</p>',
                '<hr>',
                '<p>',
                  '<span class="ws-s">Text deemed no longer relevant or accurate</span>',
                '</p>',
                '<hr>',
                '<p>',
                  '<span class="ws-code">Text from a block of computer code</span>',
                '</p>',
                '<hr>',
                '<p>',
                  'There may also be some other words stylized in some way, based on the website owner\'s preferences, but the ones listed above are the main ones.',
                '</p>',
              '</div>',
            '</div>',
          '</div>',
        '</div>'
      ].join( '' );

      var darkener = document.createElement( 'div' ),
        container, legendCtnr, contentCtnr, bar, knob, beginning,
        play, stepBackward, stepForward, settingsButton, close, info;

      darkener.id = 'ws-darken';
      darkener.innerHTML = theHTML;
      document.body.appendChild( darkener );

      container = document.getElementById( 'ws-container' ),
      legendCtnr = document.getElementById( 'ws-legend-ctnr' ),
      contentCtnr = document.getElementById( 'content-ctnr'),
      bar = document.getElementById( 'ws-progress-bar' ),
      knob = document.getElementById( 'ws-progress-knob' ),
      beginning = document.getElementById( 'ws-beginning' ),
      play = document.getElementById( 'ws-play' ),
      stepBackward = document.getElementById( 'ws-backward' ),
      stepForward = document.getElementById( 'ws-forward' ),
      settingsButton = document.getElementById( 'ws-settings-b' ),
      close = document.getElementById( 'ws-close' ),
      infoButton = document.getElementById('ws-info-b');

      wpm = document.getElementById( 'ws-speed' );
      numDisplayWords = document.getElementById( 'ws-num-words' );
      fontSize = document.getElementById( 'ws-font-size' );
      applyWordStyles = document.getElementById( 'ws-style-words' );

      W.displayWords();

      W.toggleWs( 'in' );

      W.progressBarLen = bar.offsetWidth;
      W.numWsWords = W.wsWords.length;

      W.addEvts( knob, 'mousedown', W.slideDown );
      W.addEvts( beginning, 'click', W.goToBeginning );
      W.addEvts( play, 'click', W.playWs );
      W.addEvts( stepBackward, 'mousedown', W.mDownOnButton );
      W.addEvts( stepForward, 'mousedown', W.mDownOnButton );

      W.addEvts( document, 'mouseup', W.mUpFromButton );

      W.addEvts( document, 'mouseup', W.slideCallBack );
      W.addEvts( document, 'mousemove', W.mouseMoved );

      W.addEvts( knob, 'touchstart', W.slideDown );
      W.addEvts( knob, 'touchmove', W.mouseMoved );
      W.addEvts( knob, 'touchend', W.slideCallBack );

      W.addEvts( settingsButton, 'click', W.togglePages );
      W.addEvts( infoButton, 'click', W.togglePages );

      W.addEvts( close, 'click', function() { W.toggleWs( 'out' ); } );

      W.addEvts( wpm, 'blur', function() {
        W.updateAppliedSetting( 'wpm', parseInt( wpm.value, 10 ) );
        W.msPerWord = parseInt( ( ( 1000 * 60 ) / aS.wpm ) * aS.numDisplayWords, 10 );
      } );

      W.addEvts( numDisplayWords, 'blur', function() {
        W.updateAppliedSetting( 'numDisplayWords', parseInt( numDisplayWords.value, 10 ) );
        W.msPerWord = parseInt( ( ( 1000 * 60 ) / aS.wpm ) * aS.numDisplayWords, 10 );
        W.displayWords();
      } );

      W.addEvts( fontSize, 'blur', function() {
        W.updateAppliedSetting( 'fontSize', fontSize.value );
        document.getElementById( 'ws-word-cell' ).style.fontSize = aS.fontSize;
      } );

      W.addEvts( applyWordStyles, 'blur', function() {
        W.updateAppliedSetting( 'applyWordStyles', applyWordStyles.value );

        if ( aS.applyWordStyles === 'yes' ) {
          document.getElementById( 'ws-word-cell' ).classList.remove( 'ws-no-word-styles' );
        }
        else {
          document.getElementById( 'ws-word-cell' ).classList.add( 'ws-no-word-styles' );
        }
      } );

      W.showEl( container );

      W.getSliderScale();
    },

    toggleWs: function( direction ) {

      var darkener = document.getElementById( 'ws-darken' ),
        wsContainer = document.getElementById( 'ws-container' ),
        bdy = document.body;

      if ( direction === 'in' ) {

        W.addEvts( darkener, 'mousedown', function( e ) {

          if ( ( !W.isIE8 && ( e.target !== darkener ) ) || ( W.isIE8 && ( e.srcElement !== darkener ) ) ) {

            return;
          }

          W.toggleWs( 'out' );
        });
      }
      else if ( direction === 'out' ) {

        W.playTO = window.requestAnimationFrame ? window.cancelAnimationFrame( W.playTO ) : window.clearTimeout( W.playTO );
        W.goToBeginning();
        wsContainer.parentNode.removeChild( wsContainer );
        darkener.parentNode.removeChild( darkener );
        W.removeEvts( document, 'mousemove', W.mouseMoved );
        W.removeEvts( document, 'mouseup', W.slideCallBack );
      }
    },

    showEl: function( el ) {

      el.classList.add('show-el');
    },

    togglePages: function( e ) {

      var settings = document.getElementById( 'ws-settings' ),
        settingsBtn = document.getElementById( 'ws-settings-b' ),
        info = document.getElementById( 'ws-info' ),
        infoBtn = document.getElementById( 'ws-info-b' ),
        targ = e.target;

      if ( targ === settingsBtn ) {

        settings.style.zIndex = 20;
        info.style.zIndex = 10;
      }

      if ( targ === infoBtn ) {

        settings.style.zIndex = 10;
        info.style.zIndex = 20;
      }

      if ( !W.isIE9Minus && targ === settingsBtn ) {

        if ( info.className === 'ws-info ws-info-in' ) {

          info.className = 'ws-info';

          window.setTimeout( function() { 

            if ( info.className === 'ws-info' ) {

              settings.className = 'ws-settings ws-settings-in';
            }
          }, 250 );

          return;
        }

        settings.className = settings.className === 'ws-settings' ? 'ws-settings ws-settings-in' : 'ws-settings';

        return;
      }

      if ( !W.isIE9Minus && targ === infoBtn ) {

        if ( settings.className === 'ws-settings ws-settings-in' ) {

          settings.className = 'ws-settings';
          window.setTimeout( function() {

            if ( settings.className === 'ws-settings' ) {

              info.className = 'ws-info ws-info-in';
            }
          }, 250 );

          return;
        }

        info.className = info.className === 'ws-info' ? 'ws-info ws-info-in' : 'ws-info';
        return;
      }
    },

    getSliderScale: function() {

      W.numSliderNotches = W.progressBarLen - document.getElementById( 'ws-progress-knob' ).offsetWidth + 1;

      var scaleDirection = ( W.numWsWords < W.numSliderNotches ) ? 'shrink' : 'expand',
        baseScale,
        maxWordsAtBaseScale,
        scaleCorrections;

      if ( scaleDirection === 'expand' ) {

        baseScale = Math.ceil( W.numWsWords / W.numSliderNotches ); 
        maxWordsAtBaseScale = W.numSliderNotches * baseScale;
        scaleCorrections = maxWordsAtBaseScale - W.numWsWords;
        correctionInterval = Math.floor( W.numSliderNotches / scaleCorrections );
      }
      else if ( scaleDirection === 'shrink' ) {

        baseScale = Math.ceil( W.numSliderNotches / W.numWsWords );
        maxWordsAtBaseScale = W.numWsWords * baseScale;
        scaleCorrections = maxWordsAtBaseScale - W.numSliderNotches;
        correctionInterval = Math.floor( ( W.numWsWords / scaleCorrections ) );
      }

      W.sliderScale = {
        scaleDirection: scaleDirection,
        baseScale: baseScale,
        scaleCorrections: scaleCorrections,
        correctionInterval: correctionInterval
      };
      
      W.setWsScalePos();
    },

    setWsScalePos: function() {

      var correctionHere = [],
        notch = 0,
        count = 0,
        pace;

      var setPace = function( toBeChecked ) {

        if ( toBeChecked === correctionHere[ 0 ] && ( typeof correctionHere[ 0 ] !== 'undefined' ) ) {

          pace = W.sliderScale.baseScale - 1;
          correctionHere.splice( 0, 1 );
        }
        else {

          pace = W.sliderScale.baseScale;
        }
      };

      if ( W.numWsWords === W.numSliderNotches ) {

        for ( var wordIndex = 0; ( typeof wW.wsWords[ wordIndex ] !== 'undefined' ); wordIndex++ ) {

          W.wsWords[ wordIndex ].sliderNotch = wordIndex;
        }

      }
      else if ( W.sliderScale.scaleDirection === 'expand' ) {

        for ( var correctionTest = 1; correctionTest <= W.sliderScale.scaleCorrections; correctionTest++ ) {
          
          correctionHere.push( Math.floor( ( correctionTest / W.sliderScale.scaleCorrections ) * W.numSliderNotches ) );
        }

        setPace( notch );

        for ( var wordIndex = 0; ( typeof W.wsWords[ wordIndex ] !== 'undefined' ); wordIndex++ ) {

          if ( count < pace ) {

            W.wsWords[ wordIndex ].sliderNotch = notch;
            count++;
          }
          else {

            notch++;
            count = 0;
            setPace( notch );
            W.wsWords[ wordIndex ].sliderNotch = notch;
            count++;
          }
        }
      }
      else {

        for ( var correctionTest = 1; correctionTest <= W.sliderScale.scaleCorrections; correctionTest++ ) {
          
          correctionHere.push( Math.floor( ( correctionTest / W.sliderScale.scaleCorrections ) * W.numWsWords ) );
        }

        setPace( 0 );

        for ( var wordIndex = 0; typeof W.wsWords[ wordIndex ] !== 'undefined'; wordIndex++ ) {

          W.wsWords[ wordIndex ].sliderNotch = [];

          for ( count; count < pace; count ++) {

            if ( notch <= W.numSliderNotches ) {

              W.wsWords[ wordIndex ].sliderNotch.push( notch );
              notch++;
            }
            else {

              break;
            }
          }

          count = 0;
          setPace( wordIndex + 1 );
        }
      }
    },

    goToBeginning: function() {

      var play = document.getElementById('ws-play');

      W.pauseWs();
      W.currWsWord = 0;
      W.displayWords();
      W.updateKnobPos();
    },

    playWs: function() {

      var currTime = new Date().getTime();

      if ( ( ( currTime - W.playWsLastTime ) >= ( W.msPerWord - 8 )
            || ( W.playWsLastTime === 0 && window.requestAnimationFrame ) ) ) {

        W.currWsWord = W.currWsWord + aS.numDisplayWords;

        W.playWsLastTime = currTime;

        W.setPlayEvts( 'play' );

        W.togglePlayIcon('play');

        W.displayWords();

        if ( W.wsWords[ W.currWsWord + W.wordCounter ] ) {

          W.updateKnobPos();
        }
        else {

          W.currWsWord = W.wsWords.length - 1;
          W.updateKnobPos();
          W.pauseWs();
          W.playWsLastTime = 0;

          return;
        }
      }

      W.playTO = window.requestAnimationFrame( W.playWs );
    },

    displayWords: function() {

      var wordCtnr = document.getElementById( 'ws-word-cell' ),
        lastWordsIndex = W.numWsWords - aS.numDisplayWords,
        newWordText = '',
        newWord,
        newWordSubEl,
        newWordSubElCtnr,
        anchorEl,
        frag,
        wordMarker,
        numEndingWords;

      var insertWords = function( baseWord ) {

        newWord = W.addElem( {
          tag: 'span',
          outerbox: frag,
          addMethod: 'appendChild'
        } );

        if ( ( typeof W.wsWords[ baseWord + W.wordCounter ] !== 'undefined' ) ) { 

          anchorEl = '';

          if ( typeof W.wsWords[ baseWord + W.wordCounter ].word === 'string' ) {

            if ( W.wsWords[ baseWord + W.wordCounter ].theHref !== '' ) {

              anchorEl = W.addElem( {
                tag: 'a',
                outerbox: newWord,
                addMethod: 'appendChild',
                theClass: 'ws-a',
                theHref: W.wsWords[ baseWord + W.wordCounter ].theHref
              } );

              anchorEl.target = '_blank';
            }

            newWordSubElCtnr = anchorEl === '' ? newWord : anchorEl;

            newWordSubEl = W.addElem( {
              tag: 'span',
              outerbox: newWordSubElCtnr,
              addMethod: 'appendChild',
              theClass: W.wsWords[ baseWord + W.wordCounter ].styledParents
            } );

            newWordText = W.addTxtNode( {
              txt: W.wsWords[ baseWord + W.wordCounter ].word,
              outerbox: newWordSubEl,
              addMethod: 'appendChild'
            } );
          }

          if ( W.wsWords[ baseWord + W.wordCounter ].word instanceof Array ) {

            if ( W.wsWords[ baseWord + W.wordCounter ].theHref !== '' ) {

              anchorEl = W.addElem( {
                tag: 'a',
                outerbox: newWord,
                addMethod: 'appendChild',
                theClass: 'ws-a',
                theHref: W.wsWords[ baseWord + W.wordCounter ].theHref
              } );

              anchorEl.target = '_blank';
            }

            for ( var i = 0; i < W.wsWords[ baseWord + W.wordCounter ].word.length; i++ ) {

              newWordSubElCtnr = anchorEl === '' ? newWord : anchorEl;

              newWordSubEl = W.addElem( {
                tag: 'span',
                outerbox: newWordSubElCtnr,
                addMethod: 'appendChild',
                theClass: W.wsWords[ baseWord + W.wordCounter ].word[ i ].styledParents
              } );

              newWordText = W.addTxtNode( {
                txt: W.wsWords[ baseWord + W.wordCounter ].word[ i ].word,
                outerbox: newWordSubEl,
                addMethod: 'appendChild'
              } );
            }
          }

          if ( W.wordCounter < ( aS.numDisplayWords - 1 ) ) {
            W.addTxtNode( {
              txt: ' ',
              outerbox: newWordSubElCtnr,
              addMethod: 'appendChild'
            } );
          }
        }
      };

      while ( wordCtnr.firstChild ) {

        wordCtnr.removeChild( wordCtnr.firstChild );
      }

      frag = document.createDocumentFragment();

      if ( W.currWsWord >= lastWordsIndex ) {

        for ( W.wordCounter = 0; ( W.wordCounter < aS.numDisplayWords ); W.wordCounter++ ) {

          insertWords( lastWordsIndex );
        }

      }
      else {

        for ( W.wordCounter = 0; ( W.wordCounter < aS.numDisplayWords ); W.wordCounter++ ) {

          insertWords( W.currWsWord );
        }
      }

      if ( frag.firstChild ) {

        wordCtnr.appendChild( frag );
      }
    },

    setPlayEvts: function( action ) {

      var play = document.getElementById( 'ws-play' );

      W.removeEvts( play, 'click', W.playWs );
      W.removeEvts( play, 'click', W.pauseWs );

      if ( action === 'play' ) {

        W.addEvts( play, 'click', W.pauseWs );
      }
      else {

        W.addEvts( play, 'click', W.playWs );
      }
    },

    togglePlayIcon: function(playOrPause) {

      var play = document.getElementById('ws-play');

      if (playOrPause === 'play') {

        play.className = play.className.replace(/(?:^|\s)icon-play(?!\S)/g, ' icon-pause');

        return; 
      }

      if (playOrPause === 'pause') {

        play.className = play.className.replace(/(?:^|\s)icon-pause(?!\S)/g, ' icon-play');
      }
    },

    pauseWs: function() {

      var play = document.getElementById( 'ws-play' );
      W.playTO = window.requestAnimationFrame ? window.cancelAnimationFrame( W.playTO ) : window.clearTimeout( W.playTO );
      W.setPlayEvts( 'pause' );
      W.togglePlayIcon('pause');
    },

    mDownOnButton: function( e ) {

      var targ = e.target || e.srcElement || undefined;

      if ( W.mDownOnButtonId === null ) {

        if ( typeof W.playTO !== 'undefined' ) {

          W.wasPlaying = true;
        }

        W.playTO = window.requestAnimationFrame ? window.cancelAnimationFrame( W.playTO ) : window.clearTimeout( W.playTO );

        if ( targ === document.getElementById( 'ws-backward' ) ) {

          W.mDownOnButtonId = setInterval( W.stepBackward, c.stepSpeed );
        }

        if ( targ === document.getElementById( 'ws-forward' ) ) {

          W.mDownOnButtonId = setInterval( W.stepForward, c.stepSpeed );
        }
      }
    },

    mUpFromButton: function( e ) {

      clearInterval( W.mDownOnButtonId );
      W.mDownOnButtonId = null;

      if ( W.wasPlaying === true ) {

        W.playWs();
        W.wasPlaying = false;
      }    
    },

    stepForward: function() {

      W.currWsWord = Math.min( ( W.currWsWord + c.stepSize ), ( W.numWsWords - 1 ) );
      W.displayWords();
      W.updateKnobPos();
    },

    stepBackward: function() {

      W.currWsWord = Math.max( ( W.currWsWord - c.stepSize ), 0 );
      W.displayWords();
      W.updateKnobPos();
    },

    updateKnobPos: function() {

      var knob = document.getElementById( 'ws-progress-knob' ),
        progressBar = document.getElementById( 'ws-progress-bar' ),
        maxPos = progressBar.offsetWidth - knob.offsetWidth;

      if ( typeof W.wsWords[ W.currWsWord ].sliderNotch === 'number' ) {

        knob.style.left = W.wsWords[ W.currWsWord ].sliderNotch + 'px';
      }
      else {

        if ( W.currWsWord < ( W.numWsWords - aS.numDisplayWords ) ) {

          knob.style.left = W.wsWords[ W.currWsWord ].sliderNotch[ 0 ] + 'px';
        }
        else {

          knob.style.left = ( W.numSliderNotches - 1 ) + 'px';                
        }
      }
    },

    slideDown: function( e ) {

      var knob = document.getElementById( 'ws-progress-knob' ),
        progressBar = document.getElementById( 'ws-progress-bar' );
        W.clickDown = true;

      if ( !e ) { var e = window.event; }

      var mouseCoords = W.getMouseCoords( e );
      W.initMouseXCoord = mouseCoords.x;
      W.prevKnobXCoord = knob.offsetLeft;

      if (e.type === 'touchend') {
        
      }

      if ( e.type !== 'touchmove' ) {
        W.adjustKnobPos( e );
      }

      e.preventDefault();

      return false;
    },

    getMouseCoords: function( e ) {

      var xCoord = 0,
        yCoord = 0;

      if ( !e ) { var e = window.event; }

      if ( e.changedTouches ) {

        xCoord = parseInt( e.changedTouches[ 0 ].pageX, 10 );
      }
      else if ( e.pageX || e.pageY ) {

        xCoord = e.pageX;
      }
      else if ( e.clientX || e.clientY ) {

        xCoord = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      }

      return { x: xCoord, y: yCoord };
    },

    adjustKnobPos: function ( e ) {

      var progressBar = document.getElementById( 'ws-progress-bar' ),
        knob = document.getElementById( 'ws-progress-knob' ),
        maxPos = progressBar.offsetWidth - knob.offsetWidth,
        mouseXCoord, amtKnobMoved, newPos;

      mouseXCoord = W.getMouseCoords( e ).x; 
      amtKnobMoved = mouseXCoord - W.initMouseXCoord;
      newPos = W.prevKnobXCoord + amtKnobMoved;
      newPos = Math.max( 0, newPos );
      newPos = Math.min( maxPos, newPos );
      knob.style.left = newPos + 'px';

      W.updateSliderNotch();
      W.displayWords();
    },

    mouseMoved: function( e ) {

      if ( W.clickDown ) {

        W.adjustKnobPos( e );

        e.preventDefault();
        
        return false;
      }
    },

    slideCallBack: function( e ) {

      W.clickDown = false;
    },

    updateSliderNotch: function() {

      var min = 0,
        max = W.numWsWords - 1,
        currentGuess = Math.floor( ( max - min ) / 2 ),
        knobPos = parseInt( document.getElementById( 'ws-progress-knob' ).style.left, 10 );

      if ( typeof W.wsWords[ 0 ].sliderNotch === 'number' ) {

        var search = function() {

          if ( knobPos === 0 ) {

            W.currWsWord = 0;

            return;
          }
          else if ( knobPos === W.numSliderNotches - 1 ) {
            
            W.currWsWord = max;
            
            return;
          }
          else if ( W.wsWords[ currentGuess ].sliderNotch === knobPos ) {
            
            W.currWsWord = currentGuess;
            
            return;
          }
          else if ( W.wsWords[ currentGuess ].sliderNotch < knobPos ) {
            
            min = currentGuess;
            currentGuess = Math.floor( ( max - min ) / 2 ) + currentGuess;
            search();
          }
          else {

            max = currentGuess;
            currentGuess = Math.floor( max / 2 );
            search();
          }
        };
        search( currentGuess );
      }
      else {

        var search = function() {

          var match = false;

          if ( knobPos === 0 || currentGuess === 0 ) {

            W.currWsWord = 0;

            return;
          }
          else if ( ( knobPos === W.numSliderNotches - 1 ) || currentGuess === min ) {

            W.currWsWord = max;

            return;
          }
          else {

            for ( var i = 0; W.wsWords[ currentGuess ].sliderNotch[ i ]; i++ ) {

              if ( W.wsWords[ currentGuess ].sliderNotch[ i ] === knobPos ) {

                W.currWsWord = currentGuess;

                return;
              }
            }

            if ( W.wsWords[ currentGuess ].sliderNotch[ 0 ] < knobPos ) {

              min = currentGuess;
              currentGuess = Math.floor( ( max - min ) / 2 ) + currentGuess;
              search();
            }
            else {

              max = currentGuess;
              currentGuess = Math.floor( max / 2 );
              search();
            }
          }
        };

        search();
      }
    },

    addEvts: function ( el, evt, func ) {

        el.addEventListener( evt, func, false );
    },

    removeEvts: function ( el, evt, func ) {

        el.removeEventListener( evt, func, false );
    },

    // obj accepts: tag, outerbox, addMethod, [theId, theClass, theSrc, theHref, refEl, isFrag]
    addElem: function( obj ) {

      if ( obj.isFrag === true ) {

        var newEl = document.createDocumentFragment();

        return newEl;
      }
      else {

        var newEl = document.createElement( obj.tag );
      }

      if ( typeof obj.theId === 'string' && obj.theId !== '' ) {

        newEl.id = obj.theId;
      }

      if ( typeof obj.theClass === 'string' && obj.theClass !== '' ) {

        newEl.className = obj.theClass;
      }

      if ( typeof obj.theSrc === 'string' && obj.theSrc !== '' ) {

        newEl.src = obj.theSrc;
      }

      if ( typeof obj.theHref === 'string' && obj.theHref !== '' ) {

        newEl.href = obj.theHref;
      }

      if ( obj.addMethod === 'insertBefore' ) {

        if ( typeof obj.refEl === 'string' ) {

          obj.outerbox.insertBefore( newEl, obj.refEl );
        }
        else {

          obj.outerbox.insertBefore( newEl, obj.outerbox.firstChild );
        }
      }
      else {

        obj.outerbox.appendChild( newEl );
      }

      return newEl;
    },

    // obj accepts txt, outerbox, [addMethod, refEl]
    addTxtNode: function( obj ) {
      var newTxtNode = document.createTextNode( obj.txt );
      if ( obj.addMethod === "insertBefore" ) {
        if ( typeof obj.refEl === 'string' ) {
          obj.outerbox.insertBefore( newTxtNode, obj.refEl );
        } else {
          obj.outerbox.insertBefore( newTxtNode, obj.outerbox.firstChild );
        }
      } else {
        obj.outerbox.appendChild( newTxtNode );
      }
      return newTxtNode;
    },

    // Hat tip to Ross Scrivener: http://rossscrivener.co.uk/blog/javascript-get-domain-exclude-subdomain
    getRootDomain: function() {

      var i = 0,
        domain = window.location.hostname,
        parts = domain.split('.'),
        partsL = parts.length,
        cookieTxt = '_gd' + (new Date()).getTime();

      while (i < (partsL - 1) && document.cookie.indexOf(cookieTxt + '=' + cookieTxt) === -1) {

        domain = parts.slice(-1 - (++i)).join('.');
        document.cookie = cookieTxt + '=' + cookieTxt + '; domain=' + domain;
      }

      document.cookie = cookieTxt + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=' + domain;

      return domain;
    },

    setCookie: function(args) {

      var cookieStr = '',
        date,
        expires;

      cookieStr += args.cName + '=';
      cookieStr += args.cVal;

      if (args.cDays) {

        date = new Date();
        date.setTime(date.getTime() + (args.cDays * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toGMTString();

        cookieStr += expires;

      }

      cookieStr += (args.cDomain) ? '; domain=.' + args.cDomain : '';

      cookieStr += (args.cPath) ? '; path=' + args.cPath : '; path=/';

      document.cookie = cookieStr;

    },

    readCookie: function(name) {

      var nameEQ = name + '=',
        cookies = document.cookie.split(';'),
        numCookies = cookies.length,
        cookie,
        cookieLen;

      for (var i = 0; i < numCookies; i++) {

        cookie = cookies[i],
        cookieLen = cookie.length;

        while (cookie.charAt(0) === ' ') {

          cookie = cookie.substring(1, cookieLen);
        }

        if (cookie.indexOf(nameEQ) === 0) {

          return cookie.substring(nameEQ.length, cookieLen);
        }
      }

      return null;
    }

  }
} (window, document);

let W = WordSwift;

W.init();


console.dir(W.appliedSettings);
console.log(WordSwift.rootDomain);