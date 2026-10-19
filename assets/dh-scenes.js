/*! Kaleidoscope Hero scene loader. Engines are fetched only for visible scenes. */
(function () {
  'use strict';
  var urls = window.DH_SCENES || {}, loads = {}, controllers = [];
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)'), connection = navigator.connection;
  function still() { return reduced.matches || !!(connection && connection.saveData); }
  function randomizes(cfg) { return [true,1,'1','true','yes','on'].indexOf(cfg.randomize) !== -1; }
  function engineType(cfg, slides) {
    var floatingSlides = (slides || [cfg]).every(function (slide) {return slide.style === 'Floating shape' && !randomizes(slide);});
    if (cfg.style === 'Floating shape' && floatingSlides && urls.floating) return 'floating';
    // Random mode needs every style. A fixed disco scene only needs its own renderer.
    var discoSlides = (slides || [cfg]).every(function (slide) {
      return slide.style === 'Digital disco ball' && !randomizes(slide);
    });
    return cfg.style === 'Digital disco ball' && discoSlides && urls.disco ? 'disco' : 'kaleidoscope';
  }
  function load(type) {
    if (!loads[type]) loads[type] = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = urls[type]; script.async = true;
      script.onload = resolve;
      script.onerror = function () {delete loads[type];script.remove();reject(new Error('Scene engine unavailable'));};
      document.head.appendChild(script);
    });
    return loads[type];
  }
  function background(el) {
    if (!el.classList.contains('dh-hero--background') || el.classList.contains('dh-hero--preview')) return true;
    var host = el.parentElement && el.parentElement.closest('.dh-section,.wp-block-group,.wp-block-cover,.gb-container,[class*="gb-element-"],.fusion-fullwidth,section');
    if (!host) return false;
    host.classList.add('dh-section');
    if (el.parentElement !== host) {
      var holder = el.parentElement; host.appendChild(el);
      while (holder && holder !== host && !holder.textContent.trim() && Array.prototype.every.call(holder.children,function (child) {return child.classList.contains('dh-shortcode-holder');})) {
        holder.classList.add('dh-shortcode-holder'); holder = holder.parentElement;
      }
    } else if (host.lastElementChild !== el) host.appendChild(el);
    return true;
  }
  function Controller(el) {
    this.el = el; this.data = {}; this.engine = null; this.type = ''; this.index = 0; this.visible = !('IntersectionObserver' in window); this.token = 0; this.timer = 0; this.disposed = false;
    try {this.data = JSON.parse(el.getAttribute('data-dh') || '{}');} catch (e) {}
    this.slides = this.data.slides && this.data.slides.length ? this.data.slides : [{}];
    this.interval = Math.max(3,Number(this.data.interval)||20)*1000;
    var self = this;
    this.wake = function () {self.sync();};
    document.addEventListener('visibilitychange',this.wake);
    window.addEventListener('pageshow',this.wake);
    if (reduced.addEventListener) reduced.addEventListener('change',this.wake);
    if (connection && connection.addEventListener) connection.addEventListener('change',this.wake);
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(function (entries) {self.visible = entries[0].isIntersecting;self.sync();});
      this.observer.observe(el);
    }
    el.__dhScene = this;
    this.sync();
  }
  Controller.prototype.stopEngine = function () {
    if (this.engine && this.engine.dispose) this.engine.dispose();
    else if (this.engine && this.engine.destroy) this.engine.destroy();
    // Use a fresh canvas after disposing the renderer.
    if (this.engine) {
      var canvas = this.el.querySelector('.dh-canvas');
      if (canvas) canvas.replaceWith(canvas.cloneNode(false));
    }
    this.engine = null; this.type = ''; this.loading = ''; delete this.el.__dh;
  };
  Controller.prototype.sync = function () {
    var self = this, el = this.el, cfg = this.slides[this.index], scene = cfg.scene || 'Kaleidoscope';
    clearTimeout(this.timer); this.timer = 0;
    el.style.setProperty('--dh-bg1',cfg.bgColor1 || '#140a2e');
    el.style.setProperty('--dh-bg2',cfg.bgColor2 || '#000000');
    el.style.background = cfg.gradient === 'Linear' ? 'linear-gradient(' + (Number(cfg.gradientAngle) || 0) + 'deg,var(--dh-bg1),var(--dh-bg2))' : '';
    if (scene === 'Off') {
      this.token++; this.stopEngine(); el.classList.add('dh-off'); el.classList.remove('dh-nogl');
    } else {
      el.classList.remove('dh-off');
      if (still()) {el.classList.add('dh-static');return;}
      el.classList.remove('dh-static');
      if (this.visible && !document.hidden && !this.disposed) {
        var type = engineType(cfg, this.slides);
        if (this.type && this.type !== type) this.stopEngine();
        if (!this.engine && this.loading !== type) {
          var token = ++this.token; this.loading = type;
          load(type).then(function () {
            if (self.disposed || token !== self.token) return;
            self.loading = '';
            if (still() || !self.visible || document.hidden) {self.sync();return;}
            var data = Object.assign({},self.data,{slides:[self.slides[self.index]]});
            el.classList.remove('dh-nogl');
            self.type = type;
            var api = type === 'floating' ? window.FloatingShapeHero : type === 'disco' ? window.KaleidoscopeDiscoHero : window.KaleidoscopeHero;
            self.engine = new api.Hero(el,data);
            api.instances.push(self.engine);
            el.__dh = self.engine;
          }).catch(function () {if (token === self.token) {self.loading='';el.classList.add('dh-nogl');}});
        }
      }
    }
    if (this.slides.length > 1 && this.visible && !document.hidden && !still() && !this.disposed) {
      this.timer = setTimeout(function () {
        self.index = (self.index + 1) % self.slides.length;
        if (self.engine) self.engine.update(self.slides[self.index]);
        self.sync();
      },this.interval);
    }
  };
  Controller.prototype.update = function (cfg) {
    this.token++; this.loading = '';
    this.slides = [cfg]; this.index = 0;
    var type = engineType(cfg, this.slides);
    if (this.engine && this.type === type && cfg.scene !== 'Off') this.engine.update(cfg);
    else this.stopEngine();
    this.sync();
  };
  Controller.prototype.dispose = function () {
    this.disposed = true; this.token++; clearTimeout(this.timer); this.stopEngine();
    if (this.observer) this.observer.disconnect();
    document.removeEventListener('visibilitychange',this.wake); window.removeEventListener('pageshow',this.wake);
    if (reduced.removeEventListener) reduced.removeEventListener('change',this.wake);
    if (connection && connection.removeEventListener) connection.removeEventListener('change',this.wake);
    delete this.el.__dhScene; this.el.removeAttribute('data-dh-scene-mounted');
    var index = controllers.indexOf(this); if (index !== -1) controllers.splice(index,1);
  };
  var api = window.DHScenes = {
    controllers:controllers,
    mount:function (root) {
      (root || document).querySelectorAll('.dh-hero:not([data-dh-scene-mounted])').forEach(function (el) {
        if (!background(el)) return;
        el.setAttribute('data-dh-scene-mounted','1'); controllers.push(new Controller(el));
      });
    },
    update:function (el,cfg) {if (el.__dhScene) el.__dhScene.update(cfg);},
    dispose:function (el) {if (el.__dhScene) el.__dhScene.dispose();}
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',function () {api.mount();});
  else api.mount();
})();
