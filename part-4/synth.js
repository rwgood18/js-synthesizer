(function($){

    var hzs = { // Frequency map
        'C':  32.703195662574829,
        'C#':  34.647828872109012,
        'D':  36.708095989675945,
        'D#':  38.890872965260113,
        'E':  41.203444614108741,
        'F':  43.653528929125485,
        'F#':  46.249302838954299,
        'G':  48.999429497718661,
        'G#':  51.913087197493142,
        'A':  55.000000000000000,
        'A#':  58.270470189761239,
        'B':  61.735412657015513
    };

    var keyboard = { // Keycode to note/octave map
        192: 'C,2', /* ~ */
        49: 'C#,2', /* 1 */
        50: 'D,2', /* 2 */
        51: 'D#,2', /* 3 */
        52: 'E,2', /* 4 */
        53: 'F,2', /* 5 */
        54: 'F#,2', /* 6 */
        55: 'G,2', /* 7 */
        56: 'G#,2', /* 8 */
        57: 'A,2', /* 9 */
        48: 'A#,2', /* 0 */
        189: 'B,2', /* - */
        187: 'C,3', /* = */
        81: 'C#,3', /* Q */
        87: 'D,3', /* W */
        69: 'D#,3',/* E */
        82: 'E,3',/* R */
        84: 'F,3',/* T */
        89: 'F#,3',/* Y */
        85: 'G,3',/* U */
        73: 'G#,3',/* I */
        79: 'A,3',/* O */
        80: 'A#,3',/* P */
        219: 'B,3',/* [ */
        221: 'C,4',/* ] */
        65: 'C#,4',/* A */
        83: 'D,4', /* S */
        68: 'D#,4', /* D */
        70: 'E,4', /* F */
        71: 'F,4', /* G */
        72: 'F#,4', /* H */
        74: 'G,4', /* J */
        75: 'G#,4', /* K */
        76: 'A,4', /* L */
        186: 'A#,4', /* ; */
        222: 'B,4', /* " */
        90: 'C,5', /* Z */
        88: 'C#,5', /* X */
        67: 'D,5', /* C */
        86: 'D#,5', /* V */
        66: 'E,5', /* B */
        78: 'F,5', /* N */
        77: 'F#,5', /* M */
        188: 'G,5', /* , */
        190: 'G#,5', /* . */
        191: 'A,5', /* / */
        37: 'A#,5', /* <- */
        39: 'B,5'  /* -> */
    };

    var synth = {
        type: 'sawtooth',
        octave: 3
    }

    // Create AudioContext
    var audioCtx = new(window.AudioContext || window.webkitAudioContext)();

    var activeVoices = {};

    // Voice class
    class Voice {

        constructor(rawNote, kbNote) {
            this.frequency = 0;

            var octave = synth.octave;
            
            if (octave === 1) {
                this.frequency = hzs[rawNote];
            } else if (octave === 2) {
                this.frequency = hzs[rawNote] * 2;
            } else if (octave === 3) {
                this.frequency = hzs[rawNote] * 4;
            } else if (octave === 4) {
                this.frequency = hzs[rawNote] * 8;
            } else if (octave === 5) {
                this.frequency = hzs[rawNote] * 16;
            } else if (octave === 6) {
                this.frequency = hzs[rawNote] * 32;
            } else if (octave === 7) {
                this.frequency = hzs[rawNote] * 64;
            }

            console.log('Note: ' + kbNote);
            console.log('Frequency: ' + this.frequency);

            this.kbNote = kbNote;
            this.oscillator = audioCtx.createOscillator();
            this.oscillator.type = synth.type; // Get waveform type synth settings
            this.oscillator.frequency.setValueAtTime(this.frequency, audioCtx.currentTime); // value in hertz
        }

        start() {
            this.oscillator.connect(audioCtx.destination); // connect oscillator to output
            this.oscillator.start(); 
        }


        stop() {
            this.oscillator.stop();
        }
    }

    // Add EventListeners
    $('.key').on('mousedown', function() {

        var kbNote = $(this).attr('data-note');
        synth.type = $('#waveType').val();

        // Reset octave to first showing onkeyboard (first octave on the left side)
        synth.octave = parseInt($('#octaveSelect').val());

        // Adjust octave
        if (kbNote.indexOf(2) != -1) {
          synth.octave++; // If they played in the second octave on the keyboard, add 1
        } else if (kbNote.indexOf(3) != -1) {
          synth.octave = synth.octave + 2; // If they played in the thrid octave on the keyboard, add 2
        }

        // Strip numbers. Right now it could look like this: 2F#
        var rawNote = kbNote.replace(/[0-9]/g, '');

        var voice = new Voice(rawNote, kbNote);

        activeVoices[rawNote+synth.octave] = voice;
        voice.start();

        $(this).addClass('active');
    });

    $(document).on('mouseup', function(e) {
        stopAllKeys();
        return true;
    });

    function stopAllKeys() {
        // console.log("stopping all keys");
        const keys = Object.keys(activeVoices);

        for (const key of keys) {
            activeVoices[key].stop();
            delete activeVoices[key];
        }

        $('.key').removeClass('active');
        return true;
    }

    // Computer keyboard keypress
    $(document).keydown(function(event){
        var keycode = (event.which);
        // console.log('pressed key' + keycode);
        
        if (keyboard.hasOwnProperty(keycode)) {
            var noteOctave = keyboard[keycode];
            var both = noteOctave.split(','); 
            var rawNote = both[0]; // Get raw note e.g. 'C'
            var octave = both[1]; // Get octave

            // Already playing this note. Exit.
            if (activeVoices.hasOwnProperty(rawNote+octave)) return false; 

            // Update synth to correct octave
            synth.octave = parseInt(octave);
            // If the key pressed doesn't correspond to a note on the keyboard that we can already see,
            // update the octave range
            var current = parseInt($('#octaveSelect').val());
            if (synth.octave !== current && synth.octave !== (current + 1)) {
                $('#octaveSelect').val(synth.octave); 
            }

            // Value currently showing in the oactave select dropdown
            var current = parseInt($('#octaveSelect').val()); 
            // How many actaves to offset from the first octave (from the left)
            var oOffset = synth.octave - current; 
            // Which key on the keyboard will get highlighted
            var kbNote = rawNote; 

            // Choose whether to highlight key in first, second or third octave of keyboard
            switch(oOffset) {
            case 1:
                kbNote = 2 + rawNote; // Third octave
                break;
            case 2:
                kbNote = 3 + rawNote; // Second octave
                break;
            default: // offset = 0 or error
                kbNote = rawNote; // First octave
            }

            $('[data-note="'+kbNote+'"]').addClass('active'); // Highlight key on keyboard


            var voice = new Voice(rawNote, kbNote);
            activeVoices[rawNote+synth.octave] = voice;
            voice.start();
        }
    });

    // Computer keyboard keyup
    $(document).keyup(function(event){
        var keycode = (event.which);
        // console.log('keyup' + keycode);

        if (keyboard.hasOwnProperty(keycode)) {
            var noteOctave = keyboard[keycode];
            var both = noteOctave.split(',');
            var rawNote = both[0];
            var octave = both[1];

            if(activeVoices.hasOwnProperty(rawNote+octave)) {
                var voice = activeVoices[rawNote+octave];

                voice.stop();

                var kbNote = voice.kbNote;

                // Delete voice after it's finished sounding
                // Remember the value is stored in the activeVoices object as
                // a note + octave e.g. 'C,3'
                delete activeVoices[rawNote+octave];

                $('[data-note="'+kbNote+'"]').removeClass('active');

            } else {
                stopAllKeys();
            }
        }
    });

    // Scale Keyboard
    var $keys = $("#keys");
    var $container = $("#border"); // element we want to fill completely

    function doResize(event) {
        // Don't scale it if the screen is big enough already
        if ($(window).width() > 992) return false;

        // Scale based on the '#border' element of the synthesizer
        // because this is the element we always want to fill 100%
        // with the keyboard
        var scale = $("#border").width() / $keys.outerWidth();

        $keys.css({
            transform: "translate(-50%, 0%) " + "scale(" + scale + ")"
        });
    }

    doResize(); // Scale keyboard initially

    // Scale keyboard on screensize change
    $(window).resize(function() {
        doResize();
    });

})(jQuery);