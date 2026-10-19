/*! Kaleidoscope Hero admin v1.0.0 */
jQuery(function ($) {
  $('.dh-form .dh-color').each(function () {
    $(this).wpColorPicker({
      change: function (e, ui) { $(this).val(ui.color.toString()); schedule(); },
      clear: function () { schedule(); }
    });
  });

  $(document).on('click', '.dh-copy', function () {
    var b = $(this), txt = b.data('copy');
    var done = function () { b.text('Copied'); setTimeout(function () { b.text('Copy'); }, 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done);
    else { var t = $('<textarea>').val(txt).appendTo('body').select(); document.execCommand('copy'); t.remove(); done(); }
  });

  var form = $('#dh-preset-form');
  if (!form.length) return;

  function collect() {
    var o = {};
    form.find('[name^="dh["]').each(function () {
      var m = this.name.match(/^dh\[(\w+)\]$/);
      if (!m || this.type === 'hidden') return;
      o[m[1]] = this.type === 'checkbox' ? this.checked : this.value;
    });
    return o;
  }

  function push() {
    var o = collect(), el = document.querySelector('#dh-preview .dh-hero');
    if (!el) return;
    if (window.DHScenes) window.DHScenes.update(el,o);
    else if (el.__dh) el.__dh.update(o);
    var $el = $(el);
    var text = { heading: '.dh-heading', subheading: '.dh-sub', buttonText: '.dh-btn-text', aboutText: '.dh-about-text', workText: '.dh-work-text', moreText: '.dh-more-text' };
    $.each(text, function (k, sel) { $el.find(sel).text(o[k] || ''); });
    $el.find('.dh-sub').toggle(!!o.subheading);
    $el.find('.dh-btn').toggle(!!o.buttonText);
    $el.find('.dh-more').toggle(!!o.moreText);
    $el.find('.dh-about-text').closest('a').toggle(!!o.aboutText);
    $el.find('.dh-work-text').closest('a').toggle(!!o.workText);
    $el.toggleClass('dh-hero--background', o.mode === 'Section background');
    $el.find('.dh-overlay').toggle(!!o.overlay && o.mode !== 'Section background');
    el.style.setProperty('--dh-darkness', o.darkness || 0);
    $el.find('.dh-br').toggle(!!o.brackets);
    el.style.setProperty('--dh-bg1', o.bgColor1 || '#140a2e');
    el.style.setProperty('--dh-bg2', o.bgColor2 || '#000000');
  }

  function sceneFields() {
    var enabled = (form.find('#dh-scene').val() || 'Kaleidoscope') !== 'Off';
    form.find('[data-dh-group="Animation"], [data-dh-group="Interaction"], [data-dh-group="Color blending"]').toggle(enabled);
    var blending = form.find('#dh-blendMode').val() !== 'Off';
    ['blendColor','blendAmount'].forEach(function(key){form.find('#dh-'+key).closest('.dh-field').toggle(blending);});
    form.find('#dh-ledPattern').closest('.dh-field').toggle(form.find('#dh-style').val() === 'LED globe');
    form.find('#dh-discoMouseControl').closest('.dh-field').toggle(form.find('#dh-style').val() === 'Digital disco ball');
    var style = form.find('#dh-style').val(), morphing = style === 'Morphing sculptures', sculpting = style === 'Floating shape' || morphing;
    form.find('[data-dh-group="Sculpture"]').toggle(enabled && sculpting);
    form.find('#dh-shape').closest('.dh-field').toggle(!morphing);
    form.find('[data-dh-group="Morphing sculptures"]').toggle(enabled && morphing);
    var morphMode = form.find('#dh-morphMode').val(), automaticMorph = morphMode === 'Cycle shapes' || morphMode === 'Back and forth';
    form.find('#dh-morphTo').closest('.dh-field').toggle(morphMode !== 'Cycle shapes');
    ['morphDuration','morphHold'].forEach(function(key){form.find('#dh-'+key).closest('.dh-field').toggle(automaticMorph);});
    form.find('#dh-morphProgress').closest('.dh-field').toggle(morphMode === 'Manual');
    form.find('#dh-morphScrollDistance').closest('.dh-field').toggle(morphMode === 'Scroll');
    var mouseEffect=form.find('#dh-shapeMouseEffect').val(),localExplosion=mouseEffect==='Local explosion',force=mouseEffect==='Attract'||mouseEffect==='Repel',localMouse=localExplosion||force;
    ['shapeMouseRadius','shapeMouseGlobal'].forEach(function(key){form.find('#dh-'+key).closest('.dh-field').toggle(localMouse);});
    form.find('#dh-shapeMouseStrength').closest('.dh-field').toggle(force);
    var wholeExplosion=!morphing||!!form.find('#dh-morphExplode').prop('checked');
    ['shapeTrigger','shapeExplode'].forEach(function(key){form.find('#dh-'+key).closest('.dh-field').toggle(wholeExplosion||localExplosion);});
    form.find('#dh-shapeSensitivity').closest('.dh-field').toggle(localExplosion||(wholeExplosion&&mouseEffect==='Whole sculpture explosion'));
    form.find('#dh-shapeRecovery').closest('.dh-field').toggle(wholeExplosion||localMouse);
    form.find('#dh-shapeScrollDistance').closest('.dh-field').toggle(wholeExplosion);
    var automatic = !!form.find('#dh-autoVortex').prop('checked');
    ['autoVortexStrength','autoVortexSpeed','autoVortexDirection','autoVortexRamp'].forEach(function (key) { form.find('#dh-' + key).closest('.dh-field').toggle(automatic); });
  }
  sceneFields();

  var tm;
  function schedule() { clearTimeout(tm); tm = setTimeout(push, 60); }

  form.on('input change', 'input, select, textarea', function () {
    sceneFields();
    var t = $(this);
    if (t.is('[type=range]')) t.siblings('input[type=number]').val(t.val());
    if (t.is('[type=number]')) t.siblings('input[type=range]').val(t.val());
    schedule();
  });

  $('#dh-preview').on('click', 'a', function (e) { e.preventDefault(); });
  $('#dh-name').on('input', function () {
    var s = $('#dh-new-slug');
    if (!s.data('touched') && !$('input[name=dh_slug]').val()) s.val(this.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
  });
  $('#dh-new-slug').on('input', function () { $(this).data('touched', true); });
});
