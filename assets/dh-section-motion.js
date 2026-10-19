/*! Kaleidoscope section motion: shared event-driven frames; no animation loop. */
(function () {
  'use strict';
  function mount() {
    var sections = Array.prototype.slice.call(document.querySelectorAll('.dh-section[data-dh-scroll]'));
    if (!sections.length) return;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)'), frame = 0, measure = true;
    var items = sections.map(function (section) {
      return {el:section, top:0, height:0, width:0, visible:true, distance:Math.min(400,Math.max(0,Number(section.dataset.dhScrollDistance)||0)), direction:section.dataset.dhScroll, target:section.dataset.dhScrollTarget};
    });
    function layoutTop(el) {
      var top = 0;
      // Offset coordinates ignore the scroll translation.
      while (el) {top += el.offsetTop; el = el.offsetParent;}
      return top;
    }
    function schedule() {
      if (!frame && !document.hidden) frame = window.requestAnimationFrame(update);
    }
    function update() {
      frame = 0;
      var viewport = window.innerHeight, scroll = window.scrollY, writes = [];
      // Measure the natural position on layout changes, before the browser paints.
      // A sibling placeholder would change grid/flex layouts and sticky boundaries.
      if (measure) items.forEach(function (item) {
        if (!item.el.hasAttribute('data-dh-sticky')) return;
        item.position = item.el.style.getPropertyValue('position');
        item.priority = item.el.style.getPropertyPriority('position');
        item.el.style.setProperty('position','relative','important');
      });
      items.forEach(function (item) {
        if (!item.el.isConnected) return;
        if (measure) {
          item.top = layoutTop(item.el);
          item.height = item.el.offsetHeight;
          item.width = item.el.offsetWidth;
        }
        if (!item.visible && !measure && !reduced.matches) return;
        var progress = Math.max(0,Math.min(1,(scroll + viewport - item.top) / (viewport + item.height)));
        var value = reduced.matches ? 0 : (progress - 0.5) * item.distance;
        var horizontal = item.direction === 'left' || item.direction === 'right';
        if (item.direction === 'up' || item.direction === 'left') value *= -1;
        writes.push({item:item,x:horizontal?value:0,y:horizontal?0:value,
          sx:!reduced.matches && horizontal ? 1 + item.distance/Math.max(1,item.width) : 1,
          sy:!reduced.matches && !horizontal ? 1 + item.distance/Math.max(1,item.height) : 1});
      });
      if (measure) items.forEach(function (item) {
        if (!item.el.hasAttribute('data-dh-sticky')) return;
        if (item.position) item.el.style.setProperty('position',item.position,item.priority);
        else item.el.style.removeProperty('position');
      });
      measure = false;
      writes.forEach(function (write) {
        var style = write.item.el.style;
        style.setProperty('--dh-scroll-x',write.x.toFixed(2)+'px');
        style.setProperty('--dh-scroll-y',write.y.toFixed(2)+'px');
        style.setProperty('--dh-scroll-scale-x',write.sx.toFixed(4));
        style.setProperty('--dh-scroll-scale-y',write.sy.toFixed(4));
      });
    }
    function resize() {measure = true; schedule();}
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          items.forEach(function (item) {if (item.el === entry.target) item.visible = entry.isIntersecting;});
        });
        schedule();
      },{rootMargin:'400px'});
      items.forEach(function (item) {observer.observe(item.el);});
    }
    if ('ResizeObserver' in window) {
      var sizeObserver = new ResizeObserver(resize);
      // A page layout change above a section can change its scroll origin too.
      sizeObserver.observe(document.body);
      items.forEach(function (item) {sizeObserver.observe(item.el);});
    }
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',resize,{passive:true});
    window.addEventListener('load',resize,{once:true});
    window.addEventListener('pageshow',resize);
    document.addEventListener('visibilitychange',function () {
      if (document.hidden && frame) {window.cancelAnimationFrame(frame);frame=0;}
      else if (!document.hidden) resize();
    });
    if (reduced.addEventListener) reduced.addEventListener('change',resize);
    else if (reduced.addListener) reduced.addListener(resize);
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();
