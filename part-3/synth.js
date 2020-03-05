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

    // Create AudioContext
    var audioCtx = new(window.AudioContext || window.webkitAudioContext)();

    var activeVoices = {};

    // Voice class
    class Voice {

        constructor(note) {
            // * 4 because if we only have one octave, 
            // it should be high enough to sound decent. In a future
            // post, we will make use of a greater frequency range 
            // by multiplying these 12 frequencies in hzs
            this.frequency = hzs[note] * 4; 

            console.log('Note is ' + note);
            console.log('Frequency is ' + this.frequency);

            this.note = note;
            this.oscillator = audioCtx.createOscillator();
            this.oscillator.type = $('#waveType').val(); // Get waveform type from the dropdown box
        }

        start() {
            this.oscillator.frequency.setValueAtTime(this.frequency, audioCtx.currentTime); // value in hertz
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
        var type = $('#waveType').val();

        // Reset octave to first showing onkeyboard
        synth.octave = parseInt($('#octaveSelect').val());

        // Adjust octave
        if (kbNote.indexOf(2) != -1) {
          // console.log("synth.octave:" + synth.octave);
          synth.octave++;
          // console.log("synth.octave:" + synth.octave);
        } else if (kbNote.indexOf(3) != -1) {
          // console.log("synth.octave:" + synth.octave);
          synth.octave = synth.octave + 2;
          // console.log("synth.octave:" + synth.octave);
        }

        // Strip numbers. Right now it could look like this: 2F#
        var rawNote = kbNote.replace(/[0-9]/g, '');

        var voice = new Voice(rawNote, kbNote);

        activeVoices[rawNote+synth.octave] = voice;
        voice.start();

        $(this).addClass('active');
    });

    // Stopping all keys whenever there is a mouseup event
    // anywhere on the page
    $('body').on('mouseup', function(e) {
        const keys = Object.keys(activeVoices);

        for (const key of keys) {
            // console.log('key : ' + key);
            activeVoices[key].stop();
            delete activeVoices[key];
        }
        
        $('.key').removeClass('active');
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