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
  var words=$.extend({on:'On',off:'Off',mirrors:'%s mirrors',dirty:'Unsaved changes',clean:'No unsaved changes',still:'Still background'},window.DH_EDITOR||{});
  var compactPreview=window.matchMedia&&window.matchMedia('(max-width:782px)');
  if(compactPreview){
    var fitPreview=function(){ $('.dh-preview-fold').prop('open',!compactPreview.matches); };
    fitPreview();if(compactPreview.addEventListener)compactPreview.addEventListener('change',fitPreview);
  }

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

  var pages=form.find('.dh-editor-page'),tabs=form.find('[role=tab]'),initial=form.serialize();
  function activate(id,focus){
    var tab=tabs.filter('[aria-controls="'+id+'"]');if(!tab.length)return;
    var previous=pages.filter(':not([hidden])')[0],away=previous&&previous.id!==id&&previous.getBoundingClientRect().top<110;
    tabs.attr({'aria-selected':'false',tabindex:'-1'});tab.attr({'aria-selected':'true',tabindex:'0'});
    pages.prop('hidden',true).filter('#'+id).prop('hidden',false);
    if(away)pages.filter('#'+id)[0].scrollIntoView({block:'start',behavior:'auto'});
    if(focus)tab[0].focus();
  }
  tabs.on('click',function(){activate(this.getAttribute('aria-controls'));});
  tabs.on('keydown',function(event){
    var index=tabs.index(this),next=index;
    if(event.key==='ArrowRight')next=(index+1)%tabs.length;
    else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=tabs.length-1;
    else return;
    event.preventDefault();activate(tabs[next].getAttribute('aria-controls'),true);
  });
  form.addClass('dh-editor--ready');activate('dh-page-element');
  form[0].addEventListener('invalid',function(event){
    var field=$(event.target),page=field.closest('.dh-editor-page');
    if(page.length)activate(page.attr('id'));
    field.parents('details').prop('open',true);
    field.parentsUntil(form).filter(function(){return this.hidden||$(this).css('display')==='none';}).prop('hidden',false).show();
  },true);
  function row(key,visible){form.find('#dh-'+key).closest('.dh-field').toggle(!!visible);}
  function sceneFields() {
    var value=function(key){return form.find('#dh-'+key).val();},checked=function(key){return !!form.find('#dh-'+key).prop('checked');};
    var enabled=value('scene')!=='Off',style=value('style'),background=value('mode')==='Section background';
    form.find('[data-dh-animation]').each(function(){var only=this.getAttribute('data-dh-for');$(this).toggle(enabled&&(!only||only.split('|').indexOf(style)!==-1));});
    form.find('[data-dh-speed-card]').toggle(enabled&&style!=='Video wall');
    form.find('[data-dh-still]').prop('hidden',enabled);
    form.find('#dh-random-note').prop('hidden',!enabled||!checked('randomize'));
    form.find('[data-dh-hero-content]').toggle(!background);
    form.find('[data-dh-overlay-content]').toggle(checked('overlay'));
    form.find('#dh-background-content-note').prop('hidden',!background);
    row('height',!background);row('darkness',background);
    row('gradientAngle',value('gradient')==='Linear');
    ['randomInterval','randomStyle','randomPalette','randomKaleidoscope','randomSpeeds','randomFinish','randomBackground'].forEach(function(key){row(key,checked('randomize'));});
    row('randomBackgroundTone',checked('randomize')&&checked('randomBackground'));
    row('kaleidoscopeMode',Number(value('kaleidoscope'))>=2);
    row('kaleidoscopeFraming',Number(value('kaleidoscope'))>=2&&value('kaleidoscopeMode')!=='Forward elements');
    row('cityWindows',value('cityAppearance')==='Night skyline');row('discoMouseControl',style==='Digital disco ball');
    row('multicolor',style!=='Video wall');row('glow',style!=='Video wall');row('lookRange',style!=='Video wall');row('palette',style!=='Video wall'||value('videoColor')==='Palette');
    var custom=style==='Custom 3D Object',modelParticles=custom&&value('modelDisplay')==='Particles';
    var svg=value('modelSource')==='SVG extrusion';row('modelUrl',!svg);['svgUrl','svgDepth','svgBevel'].forEach(function(key){row(key,svg);});
    row('svgBevel',svg&&Number(value('svgDepth'))>0);
    row('flow',style!=='Video wall');row('density',style!=='Video wall'&&(!custom||modelParticles));row('modelAxis',value('modelRotation')==='Automatic');row('modelRotationSpeed',value('modelRotation')==='Automatic');
    var videoParticles=style==='Video wall'&&value('videoDisplay')==='Particle wall';
    ['videoParticleSpacing','videoParticleSize','videoParticleShape','videoColor','videoDepth','videoThreshold','videoContrast'].forEach(function(key){row(key,videoParticles);});
    form.find('[data-dh-for="Floating shape|Morphing sculptures|Custom 3D Object"]').toggle(enabled&&(style==='Floating shape'||style==='Morphing sculptures'||modelParticles));
    var blending=value('blendMode')!=='Off';['blendSource','blendAmount'].forEach(function(key){row(key,blending);});row('blendColor',blending&&value('blendSource')!=='Background gradient');
    ['tessellationDensity','tessellationZoom','tessellationRotation'].forEach(function(key){row(key,value('tessellation')!=='Off');});
    ['autoVortexStrength','autoVortexSpeed','autoVortexDirection','autoVortexRamp'].forEach(function(key){row(key,checked('autoVortex'));});row('vortexRamp',Number(value('vortex'))>0);
    row('ribbonRadius',Number(value('ribbonBend'))>0);['ribbonScrollStrength','ribbonScrollDistance'].forEach(function(key){row(key,value('ribbonScroll')!=='Off');});
    var morphing=style==='Morphing sculptures',morphMode=value('morphMode'),automaticMorph=morphMode==='Cycle shapes'||morphMode==='Back and forth';
    row('shape',!morphing);row('morphExplode',morphing);row('morphTo',morphMode!=='Cycle shapes');
    ['morphDuration','morphHold'].forEach(function(key){row(key,automaticMorph);});row('morphProgress',morphMode==='Manual');row('morphScrollDistance',morphMode==='Scroll');
    var shapes=morphing?(morphMode==='Cycle shapes'?['Star','Seeded sculpture','Twisted ribbon']:[value('morphFrom'),value('morphTo')]):[value('shape')];
    row('shapeLobes',shapes.indexOf('Star')!==-1||shapes.indexOf('Seeded sculpture')!==-1);row('shapeTwist',shapes.indexOf('Twisted ribbon')!==-1||shapes.indexOf('Seeded sculpture')!==-1);
    var mouse=value('shapeMouseEffect'),local=mouse==='Local explosion',force=mouse==='Attract'||mouse==='Repel',whole=!morphing||checked('morphExplode'),explosion=whole||local,trigger=value('shapeTrigger')||'',usesMouse=trigger.indexOf('Mouse')!==-1,usesScroll=trigger.indexOf('scroll')!==-1||trigger==='Scroll';
    ['shapeMouseRadius','shapeMouseGlobal'].forEach(function(key){row(key,local||force);});row('shapeMouseStrength',force);row('shapeTrigger',explosion);row('shapeExplode',explosion&&trigger!=='Off');row('shapeSensitivity',usesMouse&&(local||(whole&&mouse==='Whole sculpture explosion')));row('shapeRecovery',force||local||whole&&trigger!=='Off');row('shapeScrollDistance',whole&&usesScroll);
    form.find('[data-dh-status]').each(function(){var key=this.getAttribute('data-dh-status'),text=words.off;if(key==='mirrors')text=Number(value('kaleidoscope'))>=2?words.mirrors.replace('%s',value('kaleidoscope')):words.off;else if(key==='vortex')text=Number(value(key))>0?words.on:words.off;else if(key==='autoVortex'||key==='randomize')text=checked(key)?words.on:words.off;else text=value(key)==='Off'?words.off:value(key)||words.off;$(this).text(text);});
    $('#dh-preview-style').text(enabled?style:words.still);
  }
  sceneFields();

  var tm;
  function schedule() { clearTimeout(tm); tm = setTimeout(push, 60); }

  form.on('input change', 'input, select, textarea', function () {
    var t = $(this);
    if (t.is('[type=range]')) t.siblings('input[type=number]').val(t.val());
    if (t.is('[type=number]')) t.siblings('input[type=range]').val(t.val());
    sceneFields();
    var dirty=form.serialize()!==initial,status=$('#dh-save-status');if(status.hasClass('is-dirty')!==dirty)status.text(dirty?words.dirty:words.clean).toggleClass('is-dirty',dirty);
    schedule();
  });

  $('#dh-preview').on('click', 'a', function (e) { e.preventDefault(); });
  $('#dh-name').on('input', function () {
    var s = $('#dh-new-slug');
    if (!s.data('touched') && !$('input[name=dh_slug]').val()) s.val(this.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
  });
  $('#dh-new-slug').on('input', function () { $(this).data('touched', true); });
});
