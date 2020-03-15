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


    $('#waveType').change(function() {
        synth.type = $(this).val();
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