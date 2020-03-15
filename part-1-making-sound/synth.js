(function($) {
        
    // create web audio api context
    var audioCtx = new(window.AudioContext || window.webkitAudioContext)();

    var oscillator; // Declare here in context where all event listeners have access

    // Controls
    $('#playBtn').click(function() {
        // Create oscillator
        oscillator = audioCtx.createOscillator();

        // Connect the oscillator node to the audio context destination which is the output
        oscillator.connect(audioCtx.destination);

        // Set frequency
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);

        // Set wave form type from select - default is Sine
        var waveType = $('#waveType').val();
        oscillator.type = waveType;

        // Start oscillator
        oscillator.start();

        // Show/hide buttons
        $('#playBtn').hide();
        $('#stopBtn').show();
    });

    $('#stopBtn').click(function() {
        // Stop the oscillator
        oscillator.stop();

        // Show/hide buttons
        $('#stopBtn').hide();
        $('#playBtn').show();
    });
    
})(jQuery);