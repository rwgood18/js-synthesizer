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

    // Create AudioContext
    var audioCtx = new(window.AudioContext || window.webkitAudioContext)();
    var pregainNode = audioCtx.createGain();
    var masterGainNode = audioCtx.createGain();
    masterGainNode.gain.setValueAtTime(-0.3, audioCtx.currentTime);  // Amount of gain in db -infinity to +infinity

    var limiterNode = audioCtx.createDynamicsCompressor();
    // Creating a compressor but setting a high threshold and 
    // high ratio so it acts as a limiter. More explanation at 
    // https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode
    limiterNode.threshold.setValueAtTime(-5.0, audioCtx.currentTime); // In Decibels
    limiterNode.knee.setValueAtTime(0, audioCtx.currentTime); // In Decibels
    limiterNode.ratio.setValueAtTime(40.0, audioCtx.currentTime);  // In Decibels
    limiterNode.attack.setValueAtTime(0.001, audioCtx.currentTime); // Time is seconds
    limiterNode.release.setValueAtTime(0.1, audioCtx.currentTime); // Time is seconds

    pregainNode.connect(limiterNode);
    limiterNode.connect(masterGainNode);
    masterGainNode.connect(audioCtx.destination);
    
    // Synth settings object
    var synth = {
        osc: {
            on: true,
            type: 'sawtooth',
        },
        octave: 3,
        // Values in Seconds
        attack: .005,
        hold: .15,
        decay: .1,
        sustain: 40, // Gain
        release: 1,
    }

    // Multipliers to convert knob turn percentages to reasonable second values
    // 'm' for Multiplier
    var mAttack = 1;
    var mHold = 1;
    var mDecay = 1;
    var mSustain = 100;
    var mRelease = 1;

    // Maximum values
    var maxAttack = 3;
    var maxHold = 2;
    var maxDecay = 2;
    var maxSustain = 100;
    var maxRelease = 4;

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
            var now = audioCtx.currentTime;
            this.voiceGain = audioCtx.createGain();
            this.oscillator.frequency.setValueAtTime(this.frequency, now); // value in hertz
            this.oscillator.connect(this.voiceGain);
            this.voiceGain.gain.setValueAtTime(0, now);

            // Attack
            this.voiceGain.gain.linearRampToValueAtTime(1, now + synth.attack);
            this.voiceGain.gain.setValueAtTime(1, now + synth.attack);

            // Hold
            this.voiceGain.gain.linearRampToValueAtTime(1, now + synth.attack + synth.hold);

            // Decay and sustain
            this.voiceGain.gain.linearRampToValueAtTime(synth.sustain, now + synth.attack + synth.hold + synth.decay);
            
            console.log('SUSTAIN: ' +synth.sustain);

            this.voiceGain.connect(pregainNode); // Connecting to output
            this.oscillator.start(0);
        }

        stop() {
            this.voiceGain.gain.linearRampToValueAtTime(.01, audioCtx.currentTime + synth.release);
            this.oscillator.stop(audioCtx.currentTime + synth.release);
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


    $('#waveType').change(function() {
        synth.type = $(this).val();
    });

    // Adapted from this codepen: https://codepen.io/jhnsnc/pen/mqPGQK
    var rgKnobContainer = document.querySelector('.rg-fl-knob');
    var rgKnob = new PrecisionInputs.FLStandardKnob(rgKnobContainer);

    // Browser specific transform property name
    var transformProp = getTransformProperty();

    var envelopeKnobStartPositions = [
        0,
        (100*synth.attack)/maxAttack,
        (100*synth.hold)/maxHold,
        (100*synth.decay)/maxDecay,
        50,
        (100*synth.release)/maxRelease
    ];

    // Select all the knobs 
    // '...'' is spread operator. This winds up giving us the elements as an Array instead of a NodeList.
    var envelopeKnobs = [...document.querySelectorAll('.fls-e_knob.envelope-knob')];  
    // console.log(envelopeKnobs.constructor);

    // Map each element to an instance of KnobInput with these update functions
    var envelopeKnobs = envelopeKnobs.map((el, idx) => new KnobInput(el, {
        visualContext: function() {
            this.indicatorRing = this.element.querySelector('.indicator-ring');
            var ringStyle = getComputedStyle(this.element.querySelector('.indicator-ring-bg'));
            this.r = parseFloat(ringStyle.r) - (parseFloat(ringStyle.strokeWidth) / 2);
            this.indicatorDot = this.element.querySelector('.indicator-dot');
            this.indicatorDot.style[`${transformProp}Origin`] = '20px 20px';
        },
        updateVisuals: function(norm) {
            // also update synth settings
            if (el.classList.contains('attack')) {
                synth.attack = maxAttack * norm;
            } else if (el.classList.contains('hold')) {
                synth.hold = maxHold * norm;
            } else if (el.classList.contains('decay')) {
               synth.decay = maxDecay * norm;
            } else if (el.classList.contains('sustain')) {
               synth.sustain = norm;
            } else if (el.classList.contains('release')) {
               synth.release = maxRelease * norm;
            }

            // update visuals
            var theta = Math.PI * 2 * norm + 0.5 * Math.PI;
            var endX = this.r * Math.cos(theta) + 20;
            var endY = this.r * Math.sin(theta) + 20;
            // using 2 arcs rather than flags since one arc collapses if it gets near 360deg
            this.indicatorRing.setAttribute('d', `M20,20l0,${this.r}${norm> 0.5?`A${this.r},${this.r},0,0,1,20,${20-this.r}`:''}A-${this.r},${this.r},0,0,1,${endX},${endY}Z`);
            this.indicatorDot.style[transformProp] = `rotate(${360*norm}deg)`;
        },
        min: 0,
        max: 100,
        initial: envelopeKnobStartPositions[idx],
    }));

    // Select the Envelope Visualization elements and store them in variables
    var container = document.querySelector('.envelope-visualizer');
    var enveloperVisualizer = {
        container: container,
        shape: container.querySelector('.envelope-shape'),
        attack: container.querySelector('.attack'),
        hold: container.querySelector('.hold'),
        decay: container.querySelector('.decay'),
        release: container.querySelector('.release'),
    };

    // Update the envelope visualizer. Use debounce to avoid overtriggering this function - not more than every 10 ms    
    var updateVisualization = debounce(function(evt) {

        var maxPtSeparation = 100; 
        var ptAttack = (maxPtSeparation * envelopeKnobs[0].value / 100);
        var ptHold = (maxPtSeparation * envelopeKnobs[1].value / 100);
        var ptDecay = (maxPtSeparation * envelopeKnobs[2].value / 100);
        var ptSustain = 100 - envelopeKnobs[3].value; // y value
        var ptRelease = (maxPtSeparation * envelopeKnobs[4].value / 100);
        // console.log('ptAttack: ' + ptAttack);
        // console.log('ptHold: ' + ptHold);
        // console.log('ptDecay: ' + ptDecay);
        // console.log('ptSustain: ' + ptSustain);
        // console.log('ptRelease: ' + ptRelease);

        // t for true
        // True because it hass all the values before it also e.g. release = attack+hold+decay+release
        var tAttack = ptAttack;
        var tHold = ptAttack + ptHold;
        var tDecay = tHold + ptDecay;
        var tSustain = ptSustain;
        var tRelease = tDecay + ptRelease;

        // Set the points on the visulizer graph
        enveloperVisualizer.attack.setAttribute('cx', tAttack);
        enveloperVisualizer.hold.setAttribute('cx', tHold);
        enveloperVisualizer.decay.setAttribute('cx', tDecay);
        enveloperVisualizer.decay.setAttribute('cy', tSustain);
        enveloperVisualizer.release.setAttribute('cx', tRelease);
      
        // Draw the line between points on the visulaizer graph
        enveloperVisualizer.shape.setAttribute('d', `M${0},100` + `C${0},100,${tAttack},0,${tAttack},0` + `L${tHold},0` + `C${tHold},0,${tDecay},${tSustain},${tDecay},${tSustain}` + `C${tDecay},${tSustain},${tRelease},100,${tRelease},100`);
        
        // Convert values to correct magnitude and label
        var param = 0;
        if (evt != null) {
            if (evt.target.parentNode.classList.contains('attack')) {
                // param = Math.round(ptAttack / mAttack * 1000);
                param = Math.round(synth.attack*1000);
            } else if (evt.target.parentNode.classList.contains('hold')) {
                param = Math.round(synth.hold*1000);
            } else if (evt.target.parentNode.classList.contains('decay')) {
                param = Math.round(synth.decay*1000);
            } else if (evt.target.parentNode.classList.contains('sustain')) {
                param = Math.round(synth.sustain * mSustain);
            } else if (evt.target.parentNode.classList.contains('release')) {
                param = Math.round(synth.release*1000);
            }
            evt.target.parentNode.parentNode.querySelector('.msLabel').innerHTML = param + evt.target.parentNode.parentNode.querySelector('.msLabel').getAttribute('data-unit');
        }

    }, 10);

    // When the knob gets turned, call the update functions we just defined above
    envelopeKnobs.forEach(knob => {
        knob.addEventListener('change', updateVisualization);
    });

    // Initialize knob value labels
    function initEnvelopeKnobs() {
        $('.envelope-knob.attack').siblings('.msLabel').text(Math.round(synth.attack * 1000) + 'ms');
        $('.envelope-knob.hold').siblings('.msLabel').text(Math.round(synth.hold / mHold * 1000) + 'ms');
        $('.envelope-knob.decay').siblings('.msLabel').text(Math.round(synth.decay / mDecay * 1000) + 'ms');
        $('.envelope-knob.sustain').siblings('.msLabel').text(Math.round(synth.sustain * mSustain) + '%');
        $('.envelope-knob.release').siblings('.msLabel').text(Math.round(synth.release / mRelease * 1000) + 'ms');
    }
    initEnvelopeKnobs();
    updateVisualization();

    // Scale envelope
    var $container = $("#border"); // element we want to fill completely
    var $envelope = $('#envelope');
    var resizeEnvelope = () => {
        // Scale based on the '#border' element of the synthesizer
        // because this is the element we always want to fill 100%
        // with the keyboard
        var scale = $("#border").width() / $envelope.outerWidth();
        $envelope.css({
            transform: "translate(-50%, -50%) " + "scale(" + scale + ")"
        });
        var height = $envelope.height();
        $('.envelope').css({height: (height + 100*(scale - .5))});
    };
    window.addEventListener('resize orientationchange', resizeEnvelope);
    

    // Scale Keyboard
    var $keys = $("#keys");
    var resizeKeyboard = () => {
        // Scale based on the '#border' element of the synthesizer
        // because this is the element we always want to fill 100%
        // with the keyboard
        var scale = $("#border").width() / $keys.outerWidth();
        $keys.css({
            transform: "translate(-50%, 0%) " + "scale(" + scale + ")"
        });
    }

    // Scale keyboard on screensize change
    $(window).on('resize orientationchange', function() {
        resizeKeyboard();
        resizeEnvelope();
    });
    
    // Scale keyboard and envelope initially
    $(document).ready(function() {
        resizeEnvelope();
        resizeKeyboard(); 
    });
    
    // Utility functions
    function getSupportedPropertyName(properties) {
        for (var i = 0; i < properties.length; i++)
            if (typeof document.body.style[properties[i]] !== 'undefined') return properties[i];
        return null;
    }

    function getTransformProperty() {
        return getSupportedPropertyName(['transform', 'msTransform', 'webkitTransform', 'mozTransform', 'oTransform']);
    }

    // Debounce prevents the function from being called to frequently as is likely to happen with a knob
    function debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this,
                args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

})(jQuery);
