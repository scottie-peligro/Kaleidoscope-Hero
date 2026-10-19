/*! Kaleidoscope Hero reusable templates. Admin only. */
jQuery(function ($) {
  'use strict';
  var config=window.DH_TEMPLATES||{},messages=config.messages||{},templates=Object.create(null),form=$('#dh-preset-form'),undo=null;
  (config.templates||[]).forEach(function(item){templates[item.id]=item;});
  function status(message,error){$('#dh-template-status').text(message||'').toggleClass('is-error',!!error);}
  function collect(){
    var values={};
    form.find('[name^="dh["]').each(function(){var match=this.name.match(/^dh\[(\w+)\]$/);if(match&&this.type!=='hidden')values[match[1]]=this.type==='checkbox'?this.checked:this.value;});
    return values;
  }
  function apply(values){
    Object.keys(values).forEach(function(key){
      var input=document.getElementById('dh-'+key);if(!input)return;var field=$(input),value=values[key];
      if(input.type==='checkbox')field.prop('checked',value===true||value===1||value==='1'||value==='true'||value==='yes'||value==='on');
      else{field.val(value);if(input.type==='number')field.siblings('input[type=range]').val(value);if(field.hasClass('wp-color-picker')&&$.fn.wpColorPicker)field.wpColorPicker('color',value);}
    });
    // The existing editor handles conditional controls, text and live scene updates.
    form.find('#dh-style').trigger('change');
  }
  $('#dh-template-apply').on('click',function(){
    var template=templates[$('#dh-template-select').val()];if(!template){status(messages.choose,true);return;}
    undo=collect();apply(template.settings);$('#dh-template-undo').prop('disabled',false);status(messages.applied);
  });
  $('#dh-template-undo').on('click',function(){if(!undo)return;apply(undo);undo=null;$(this).prop('disabled',true);status(messages.undone);});
  $('#dh-template-save').on('click',function(){
    var button=$(this),name=$('#dh-template-name').val().trim();if(!name){status(messages.name,true);$('#dh-template-name').trigger('focus');return;}
    button.prop('disabled',true);status('');
    $.ajax({url:config.ajaxUrl,method:'POST',dataType:'json',data:{action:'dh_save_template',nonce:config.nonce,name:name,scope:$('#dh-template-scope').val(),settings:JSON.stringify(collect())}})
      .done(function(response){
        if(!response||!response.success||!response.data||!response.data.template){status(response&&response.data&&response.data.message||messages.error,true);return;}
        var item=response.data.template;templates[item.id]=item;
        $('<option>').val(item.id).text(item.name+' — '+(item.scope==='full'?messages.full:messages.look)).appendTo('#dh-template-select');
        $('#dh-template-select').val(item.id);$('#dh-template-name').val(item.name);status(response.data.message);
      }).fail(function(xhr){status(xhr.responseJSON&&xhr.responseJSON.data&&xhr.responseJSON.data.message||messages.error,true);})
      .always(function(){button.prop('disabled',false);});
  });
  $('.dh-template-delete').on('submit',function(event){if(!window.confirm(messages.delete))event.preventDefault();});
});
