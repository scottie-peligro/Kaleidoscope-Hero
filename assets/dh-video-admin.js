/*! Video source picker and optional browser-native short-loop compressor. */
jQuery(function ($) {
  'use strict';
  var form = $('#dh-preset-form');
  if (!form.length) return;
  var current = null;
  function setStatus(message) { $('#dh-video-encode-status').text(message); }
  function finish() {
    if (!current) return;
    cancelAnimationFrame(current.frame);
    if (current.recorder && current.recorder.state !== 'inactive') current.recorder.stop();
    if (current.stream) current.stream.getTracks().forEach(function (track) { track.stop(); });
    if (current.video) { current.video.pause(); current.video.removeAttribute('src'); current.video.load(); }
    if (current.objectUrl) URL.revokeObjectURL(current.objectUrl);
    current = null;
    $('#dh-video-encode-start-button').prop('disabled', false);
    $('#dh-video-encode-cancel-button').prop('hidden', true);
  }
  $('.dh-video-library').on('click', function () {
    var key = this.getAttribute('data-field');
    var frame = wp.media({ title: key === 'videoPoster' ? 'Choose still image' : 'Choose video', button: { text: 'Use this file' }, library: { type: key === 'videoPoster' ? 'image' : 'video' }, multiple: false });
    frame.on('select', function () { var item = frame.state().get('selection').first(); if (item) $('#dh-' + key).val(item.get('url')).trigger('change'); });
    frame.open();
  });
  $('.dh-video-clear').on('click', function () { $('#dh-' + this.getAttribute('data-field')).val('').trigger('change'); });
  $('#dh-video-encode-cancel-button').on('click', function () { finish(); setStatus('Compression cancelled.'); });
  $('#dh-video-encode-start-button').on('click', async function () {
    if (current) return;
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported || !HTMLCanvasElement.prototype.captureStream) { setStatus('This browser cannot create a compressed copy. Use an MP4 or WebM prepared in a video editor.'); return; }
    var type = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/mp4'].find(function (mime) { return MediaRecorder.isTypeSupported(mime); });
    if (!type) { setStatus('No supported recording format was found in this browser.'); return; }
    var file = $('#dh-video-input')[0].files[0], source = $('#dh-videoUrl').val().trim();
    if (!file && !source) { setStatus('Choose a source file or set Video source first.'); return; }
    var spec = { small: [640,18,400000], balanced: [960,24,900000], sharp: [1280,24,1600000] }[$('#dh-video-encode-quality').val()] || [960,24,900000];
    var seconds = Math.max(2,Math.min(30,Number($('#dh-video-encode-seconds').val())||10));
    var offset = Math.max(0,Math.min(300,Number($('#dh-video-encode-start').val())||0));
    var run = current = { video: document.createElement('video'), frame: 0, objectUrl: file ? URL.createObjectURL(file) : '' };
    $('#dh-video-encode-start-button').prop('disabled', true);
    $('#dh-video-encode-cancel-button').prop('hidden', false);
    try {
      var video = run.video;
      video.muted = true; video.playsInline = true; video.preload = 'auto'; video.crossOrigin = 'anonymous';
      video.src = run.objectUrl || source;
      await new Promise(function (resolve, reject) { video.onloadedmetadata = resolve; video.onerror = function () { reject(Error('The video could not be opened. Choose a local file or a Media Library video.')); }; });
      if (current !== run) return;
      var width = Math.min(spec[0], video.videoWidth), height = Math.max(2, Math.round(video.videoHeight * width / video.videoWidth / 2) * 2);
      if (!width || !height) throw Error('The video has no readable frames.');
      if (Number.isFinite(video.duration)) offset = Math.min(offset,Math.max(0,video.duration-0.1));
      if (offset > 0.01) {
        video.currentTime = offset;
        await new Promise(function (resolve, reject) { video.onseeked = resolve; video.onerror = function () { reject(Error('Seeking the video failed.')); }; });
      }
      if (video.readyState < 2) await new Promise(function (resolve, reject) { video.onloadeddata = resolve; video.onerror = function () { reject(Error('The first video frame could not be read.')); }; });
      if (current !== run) return;
      var canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      var ctx = canvas.getContext('2d', { alpha: false });
      ctx.drawImage(video, 0, 0, width, height);
      var makePoster = !$('#dh-videoPoster').val();
      var posterBlob = makePoster ? await new Promise(function (resolve) { canvas.toBlob(resolve, 'image/webp', 0.72); }) : null;
      run.stream = canvas.captureStream(spec[1]);
      var recorder = run.recorder = new MediaRecorder(run.stream, { mimeType: type, videoBitsPerSecond: spec[2] });
      var chunks = [];
      recorder.ondataavailable = function (event) { if (event.data.size) chunks.push(event.data); };
      var recorded = new Promise(function (resolve, reject) { recorder.onstop = resolve; recorder.onerror = function () { reject(Error('Video recording failed.')); }; });
      var startAt = 0, last = 0, ended = false;
      function draw(now) {
        if (current !== run || ended) return;
        if (now - last >= 1000/spec[1]) { ctx.drawImage(video, 0, 0, width, height); last = now; }
        var elapsed = (now-startAt)/1000;
        setStatus('Recording ' + Math.min(seconds,Math.floor(elapsed)) + ' / ' + seconds + ' seconds…');
        if (elapsed >= seconds || video.ended) { ended = true; recorder.stop(); return; }
        run.frame = requestAnimationFrame(draw);
      }
      video.loop = false;
      await video.play();
      if (current !== run) return;
      recorder.start(1000); startAt = performance.now(); run.frame = requestAnimationFrame(draw);
      await recorded;
      if (current !== run) return;
      var blob = new Blob(chunks, { type: recorder.mimeType });
      if (blob.size < 1000) throw Error('The compressed copy contains no frames.');
      setStatus('Uploading ' + (blob.size/1048576).toFixed(2) + ' MB copy to Media Library…');
      var ext = recorder.mimeType.indexOf('mp4') !== -1 ? 'mp4' : 'webm';
      async function upload(fileBlob, filename) {
        var data = new FormData(); data.append('action', 'upload-attachment'); data.append('_wpnonce', DH_VIDEO_ADMIN.nonce);
        data.append('async-upload', new File([fileBlob], filename, { type: fileBlob.type.split(';')[0] }));
        var response = await fetch(DH_VIDEO_ADMIN.ajaxUrl, { method: 'POST', body: data, credentials: 'same-origin' });
        var result = await response.json();
        if (!result.success || !result.data || !result.data.url) throw Error(result.data && result.data.message ? result.data.message : 'Media Library rejected the copy.');
        return result.data.url;
      }
      var resultUrl = await upload(blob, 'kaleidoscope-loop-' + Date.now() + '.' + ext);
      if (current !== run) return;
      var original = file ? file.size : 0;
      $('#dh-videoUrl').val(resultUrl).trigger('change');
      var posterNote = '';
      if (posterBlob && posterBlob.size > 1000) {
        try { var posterUrl=await upload(posterBlob, 'kaleidoscope-still-' + Date.now() + '.webp'); if (current === run) $('#dh-videoPoster').val(posterUrl).trigger('change'); }
        catch (posterError) { posterNote = ' Choose a still image separately if needed.'; }
      }
      if (current !== run) return;
      finish();
      setStatus('Compressed copy ready (' + (blob.size/1048576).toFixed(2) + ' MB' + (original ? ', original ' + (original/1048576).toFixed(2) + ' MB' : '') + '). Preview it, then Save preset.' + posterNote);
    } catch (error) { if (current === run) { finish(); setStatus(error.message || 'Compression failed.'); } }
  });
});
