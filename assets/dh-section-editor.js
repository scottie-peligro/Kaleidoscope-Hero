/* Kaleidoscope Section: native blocks for content, static preview in the editor. */
(function (wp) {
  'use strict';
  var el = wp.element.createElement, __ = wp.i18n.__;
  var editor = wp.blockEditor, controls = wp.components;
  var presets = (window.DH_SECTION_EDITOR || {}).presets || [];
  function attributeRows(value) {
    return (Array.isArray(value) ? value : []).filter(function(row){return row && typeof row.name === 'string' && typeof row.value === 'string';}).map(function(row){return {name:row.name,value:row.value};});
  }
  function AttributesControl(props) {
    var a = props.attributes;
    var previousAnchor = wp.element.useRef(a.anchor);
    wp.element.useEffect(function(){
      if (previousAnchor.current === a.anchor) return;
      previousAnchor.current = a.anchor;
      var stored = attributeRows(a.htmlAttributes), changed = false;
      var next = stored.map(function(row){
        if (row.name.trim().toLowerCase() === 'id' && row.value !== (a.anchor || '')) {changed=true;return {name:row.name,value:a.anchor || ''};}
        return row;
      });
      if (changed) props.setAttributes({htmlAttributes:next});
    },[a.anchor,a.htmlAttributes]);
    var rows = attributeRows(a.htmlAttributes);
    if (a.anchor && !rows.some(function(row){return row.name.trim().toLowerCase() === 'id';})) rows.unshift({name:'id',value:a.anchor});
    if (!rows.length || rows[rows.length-1].name || rows[rows.length-1].value) rows.push({name:'',value:''});
    function update(next) {
      while (next.length && !next[next.length-1].name && !next[next.length-1].value) next.pop();
      var changes = {htmlAttributes:next};
      var idRow = next.filter(function(row){return row.name.trim().toLowerCase() === 'id';}).pop();
      if (idRow) changes.anchor = idRow.value.trim().replace(/\s+/g,'-');
      else if (rows.some(function(row){return row.name.trim().toLowerCase() === 'id';})) changes.anchor = '';
      props.setAttributes(changes);
    }
    return el('div',{className:'dh-html-attributes'},
      el('h3',{className:'dh-html-attributes-title'},__('HTML attributes','kaleidoscope-hero')),
      rows.map(function(row,index){
        function change(field,value) {
          var next = rows.map(function(item){return {name:item.name,value:item.value};});
          next[index][field]=value; update(next);
        }
        return el('div',{className:'dh-html-attribute-row',key:index},
          el(controls.TextControl,{label:__('Attribute name','kaleidoscope-hero')+' '+(index+1),hideLabelFromVision:true,placeholder:__('Name','kaleidoscope-hero'),value:row.name,onChange:function(value){change('name',value);},autoComplete:'off',__nextHasNoMarginBottom:true}),
          el(controls.TextControl,{label:__('Attribute value','kaleidoscope-hero')+' '+(index+1),hideLabelFromVision:true,placeholder:__('Value','kaleidoscope-hero'),value:row.value,onChange:function(value){change('value',value);},autoComplete:'off',__nextHasNoMarginBottom:true}),
          (index < rows.length-1 || row.name || row.value) ? el(controls.Button,{icon:el('svg',{width:16,height:16,viewBox:'0 0 24 24','aria-hidden':true,focusable:false},el('path',{fill:'currentColor',d:'m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z'})),label:__('Remove attribute','kaleidoscope-hero')+' '+(index+1),isDestructive:true,size:'small',onClick:function(){var next=rows.slice();next.splice(index,1);update(next);}}) : el('span',null)
        );
      }),
      el('p',{className:'components-base-control__help'},__('Applies to the outer section. Use id, aria-labelledby, data-* and other standard HTML attributes. ID stays in sync with HTML anchor.','kaleidoscope-hero'))
    );
  }
  function MotionControl(props) {
    var a = props.attributes;
    function change(name,value) {var next={};next[name]=value;props.setAttributes(next);}
    var sticky = a.stickyPosition || 'off', direction = a.scrollDirection || 'none';
    return el('div',{className:'dh-section-motion-controls'},
      el('h3',{className:'dh-html-attributes-title'},__('Position & scroll','kaleidoscope-hero')),
      el(controls.SelectControl,{label:__('Sticky position','kaleidoscope-hero'),value:sticky,options:[{label:__('Off','kaleidoscope-hero'),value:'off'},{label:__('Top','kaleidoscope-hero'),value:'top'},{label:__('Bottom','kaleidoscope-hero'),value:'bottom'}],onChange:function(value){change('stickyPosition',value);}}),
      sticky !== 'off' && el(wp.element.Fragment,null,
        el(controls.RangeControl,{label:__('Sticky offset (px)','kaleidoscope-hero'),value:a.stickyOffset === undefined?0:a.stickyOffset,min:0,max:300,step:1,onChange:function(value){change('stickyOffset',value === undefined?0:value);}}),
        el(controls.RangeControl,{label:__('Stacking order','kaleidoscope-hero'),help:__('Higher values place the section above nearby content.','kaleidoscope-hero'),value:a.stickyZIndex === undefined?1:a.stickyZIndex,min:0,max:100,step:1,onChange:function(value){change('stickyZIndex',value === undefined?1:value);}}),
        el('p',{className:'components-base-control__help'},__('Sticky stays within its parent. Give the parent extra height and avoid overflow: hidden or auto on its ancestors.','kaleidoscope-hero'))
      ),
      el(controls.SelectControl,{label:__('Move on scroll','kaleidoscope-hero'),value:direction,options:[{label:__('Off','kaleidoscope-hero'),value:'none'},{label:__('Up','kaleidoscope-hero'),value:'up'},{label:__('Down','kaleidoscope-hero'),value:'down'},{label:__('Left','kaleidoscope-hero'),value:'left'},{label:__('Right','kaleidoscope-hero'),value:'right'}],onChange:function(value){change('scrollDirection',value);}}),
      direction !== 'none' && el(wp.element.Fragment,null,
        el(controls.SelectControl,{label:__('Move','kaleidoscope-hero'),value:a.scrollTarget || 'background',options:[{label:__('Animated background only','kaleidoscope-hero'),value:'background'},{label:__('Whole section, including content','kaleidoscope-hero'),value:'section'}],onChange:function(value){change('scrollTarget',value);}}),
        el(controls.RangeControl,{label:__('Travel distance (px)','kaleidoscope-hero'),value:a.scrollDistance === undefined?100:a.scrollDistance,min:0,max:400,step:10,onChange:function(value){change('scrollDistance',value === undefined?100:value);}}),
        el('p',{className:'components-base-control__help'},__('Direction applies as you scroll down; scrolling up reverses it. Motion follows the section through the viewport and respects reduced-motion preferences. Preview on the page.','kaleidoscope-hero'))
      )
    );
  }
  // Editor-only components shared with local control verification fixtures.
  window.DHSectionEditor = {AttributesControl:AttributesControl,MotionControl:MotionControl};
  wp.blocks.registerBlockType('kaleidoscope-hero/section', {
    apiVersion: 3,
    title: __('Kaleidoscope Section', 'kaleidoscope-hero'),
    description: __('An animated background behind your own headings, columns, images, and forms.', 'kaleidoscope-hero'),
    icon: 'format-gallery', category: 'design',
    keywords: [__('background', 'kaleidoscope-hero'), __('animation', 'kaleidoscope-hero'), __('hero', 'kaleidoscope-hero')],
    attributes: { preset: {type:'string',default:'home'}, darkness: {type:'number',default:0.35}, htmlAttributes: {type:'array',default:[]}, stickyPosition:{type:'string',default:'off',enum:['off','top','bottom']}, stickyOffset:{type:'number',default:0}, stickyZIndex:{type:'number',default:1}, scrollDirection:{type:'string',default:'none',enum:['none','up','down','left','right']}, scrollDistance:{type:'number',default:100}, scrollTarget:{type:'string',default:'background',enum:['background','section']} },
    supports: {align:['wide','full'],anchor:true,html:false,spacing:{padding:true,margin:true},color:{text:true,background:false}},
    edit: function (props) {
      var a = props.attributes, chosen = presets.filter(function (p) {return p.value === a.preset;})[0] || presets[0] || {bg1:'#140a2e',bg2:'#000000'};
      var blockProps = editor.useBlockProps({className:'dh-section-editor',style:{'--dh-editor-bg1':chosen.bg1,'--dh-editor-bg2':chosen.bg2,'--dh-editor-darkness':a.darkness}});
      var innerProps = editor.useInnerBlocksProps({className:'dh-section-editor-content'}, {
        template: [['core/heading',{level:2,content:__('Your section heading', 'kaleidoscope-hero')}],['core/paragraph',{content:__('Add your content here. The animation will fill the section behind it.', 'kaleidoscope-hero')}]],
        renderAppender: editor.InnerBlocks.ButtonBlockAppender
      });
      return el(wp.element.Fragment,null,
        el(editor.InspectorControls,null,el(controls.PanelBody,{title:__('Animated background', 'kaleidoscope-hero'),initialOpen:true},
          el(controls.SelectControl,{label:__('Animation preset', 'kaleidoscope-hero'),value:chosen.value || a.preset,options:presets.map(function(p){return {label:p.label,value:p.value};}),onChange:function(value){props.setAttributes({preset:value});}}),
          el(controls.RangeControl,{label:__('Background darkness', 'kaleidoscope-hero'),help:__('Increase this to make your content easier to read.', 'kaleidoscope-hero'),value:a.darkness,min:0,max:0.9,step:0.05,onChange:function(value){props.setAttributes({darkness:value === undefined ? 0.35 : value});}}),
          el('p',null,__('The editor uses a still preview. The animation runs on the page and follows the height of your content.', 'kaleidoscope-hero'))
        )),
        el(editor.InspectorAdvancedControls,null,el(AttributesControl,{attributes:a,setAttributes:props.setAttributes}),el(MotionControl,{attributes:a,setAttributes:props.setAttributes})),
        el('section',blockProps,el('div',innerProps))
      );
    },
    save: function () {return el(editor.InnerBlocks.Content);}
  });
})(window.wp);
