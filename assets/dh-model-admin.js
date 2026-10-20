jQuery(function($){
 'use strict';var words=window.DH_MODELS;if(!words)return;
 [{prefix:'model',key:'modelUrl',extension:'glb',mime:'model/gltf-binary',limit:10*1024*1024},{prefix:'svg',key:'svgUrl',extension:'svg',mime:'application/json',limit:512*1024}].forEach(function(cfg){
  var field=$('#dh-'+cfg.key),input=$('#dh-'+cfg.prefix+'-file'),status=$('#dh-'+cfg.prefix+'-upload-status'),button=$('#dh-'+cfg.prefix+'-upload');if(!field.length)return;
  $('#dh-'+cfg.prefix+'-clear').on('click',function(){field.val('').trigger('change');status.text('');});button.on('click',function(){input[0].click();});
  input.on('change',function(){
   var file=this.files[0];if(!file)return;
   if(file.name.toLowerCase().slice(-cfg.extension.length-1)!=='.'+cfg.extension||file.size>cfg.limit){status.text(cfg.prefix==='svg'?words.svgSize:words.size);this.value='';return;}
   var data=new FormData();data.append('action','dh_upload_model');data.append('nonce',words.nonce);data.append('model',file);button.prop('disabled',true);status.text(words.loading);
   $.ajax({url:words.ajaxUrl,method:'POST',data:data,processData:false,contentType:false}).done(function(result){if(result.success){field.val(result.data.url).trigger('change');status.text(words.uploaded);}else status.text(result.data&&result.data.message||words.error);}).fail(function(xhr){status.text(xhr.responseJSON&&xhr.responseJSON.data&&xhr.responseJSON.data.message||words.error);}).always(function(){button.prop('disabled',false);input.val('');});
  });
  var frame;$('#dh-'+cfg.prefix+'-library').on('click',function(){if(!window.wp||!wp.media)return;if(!frame){frame=wp.media({title:words.choose,button:{text:words.use},library:{type:cfg.mime},multiple:false});frame.on('select',function(){var model=frame.state().get('selection').first().toJSON();field.val(model.url).trigger('change');status.text('');});}frame.open();});
 });
});
